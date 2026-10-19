"""Run with python3 -m unittest discover -s scripts/tests -v."""
import contextlib
import importlib.util
import io
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]


def load_script(path):
    spec = importlib.util.spec_from_file_location('security_script', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class PrivateConfigurationTest(unittest.TestCase):
    def test_generated_configuration_is_private_unique_and_never_overwritten(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'backend').mkdir()
            shutil.copy(ROOT / 'backend/.env.e2e.example', root / 'backend/.env.e2e.example')
            module = load_script(ROOT / 'scripts/e2e/prepare-local.py')
            module.ROOT = root
            module.TARGET = root / 'backend/.env.e2e.local'
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                self.assertEqual(module.main(), 0)
            original = module.TARGET.read_bytes()
            fields = dict(line.split('=', 1) for line in original.decode().splitlines() if '=' in line and not line.startswith('#'))
            self.assertEqual(os.stat(module.TARGET).st_mode & 0o777, 0o600)
            self.assertNotEqual(fields['DB_PASSWORD'], fields['SECURITY_JWT_SECRET'])
            for key in ('DB_PASSWORD', 'SECURITY_JWT_SECRET'):
                self.assertGreaterEqual(len(fields[key]), 64)
                self.assertNotIn(fields[key], output.getvalue())
            with contextlib.redirect_stdout(output):
                self.assertEqual(module.main(), 0)
            self.assertEqual(module.TARGET.read_bytes(), original)


class SecretScannerTest(unittest.TestCase):
    def test_staged_secret_is_detected_even_after_worktree_cleanup(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(['git', 'init', '-q', str(root)], check=True)
            token = 'gh' + 'p_' + 'X' * 36
            path = root / 'configuration.txt'
            path.write_text(token)
            subprocess.run(['git', '-C', str(root), 'add', 'configuration.txt'], check=True)
            path.write_text('clean worktree')
            module = load_script(ROOT / 'scripts/check-secrets.py')
            module.ROOT = root
            output = io.StringIO()
            with patch('sys.argv', ['check-secrets.py']), contextlib.redirect_stdout(output):
                self.assertEqual(module.main(), 1)
            self.assertIn('GitHub token', output.getvalue())
            self.assertNotIn(token, output.getvalue())

    def test_private_paths_and_examples(self):
        module = load_script(ROOT / 'scripts/check-secrets.py')
        for name in ('backend/.env', 'backend/.env.e2e.local', 'frontend/cypress.env.json', 'private.pem'):
            self.assertTrue(module.private_path(name), name)
        for name in ('backend/.env.example', 'backend/.env.e2e.example', 'frontend/cypress.env.example.json'):
            self.assertFalse(module.private_path(name), name)

    def test_e2e_guard_rejects_external_database(self):
        environment = dict(os.environ, DB_HOST='external.invalid', DB_PORT='55433', DB_NAME='tutorlink_e2e', DB_USER='tutorlink_e2e', DB_PASSWORD='synthetic-test-only')
        result = subprocess.run(['sh', str(ROOT / 'scripts/e2e/verify-environment.sh')], env=environment, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn(environment['DB_PASSWORD'], result.stderr)


if __name__ == '__main__':
    unittest.main()
