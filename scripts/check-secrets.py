#!/usr/bin/env python3
"""Offline, redacted checks of tracked files, staged snapshots and optional history.

This is a focused safety net, not a complete credential scanner.
"""
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PATTERNS = {
    'private key': rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
    'GitHub token': rb'gh[pousr]_[A-Za-z0-9]{30,}',
    'AWS access key': rb'AKIA[0-9A-Z]{16}',
    'Google API key': rb'AIza[0-9A-Za-z_-]{35}',
    'Slack token': rb'xox[baprs]-[0-9A-Za-z-]{20,}',
}
# Split the detector literals to avoid matching this scanner's own source.
PRIVATE_SUFFIXES = ('.pem', '.key', '.p12', '.pfx', '.jks', '.keystore', '.har', '.dump')


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def private_path(name):
    path = Path(name)
    return ((path.name == '.env' or path.name.startswith('.env.'))
            and not path.name.endswith('.example')) or path.name == 'cypress.env.json' or name.endswith(PRIVATE_SUFFIXES)


def inspect(name, data):
    found = []
    if private_path(name):
        found.append(f'archivo privado: {name}')
    for label, pattern in PATTERNS.items():
        if re.search(pattern, data):
            found.append(f'{label}: {name} [valor oculto]')
    return found


def main():
    findings = set()
    names = git('ls-files', '-z').decode().split('\0')
    for name in filter(None, names):
        path = ROOT / name
        if path.is_file():
            findings.update(inspect(name, path.read_bytes()))
    # Also inspect index bytes: an unstaged cleanup must not hide staged secrets.
    for record in git('ls-files', '--stage', '-z').decode().split('\0'):
        if not record:
            continue
        metadata, name = record.split('\t', 1)
        findings.update(inspect(name, git('cat-file', 'blob', metadata.split()[1])))
    if '--history' in sys.argv:
        for record in git('rev-list', '--objects', '--all').decode().splitlines():
            oid, _, name = record.partition(' ')
            if not name or git('cat-file', '-t', oid).strip() != b'blob':
                continue
            findings.update(inspect(name, git('cat-file', 'blob', oid)))
    for finding in sorted(findings):
        print(finding)
    print(f'Revisión terminada: {len(findings)} hallazgo(s). No se imprimen valores privados.')
    return int(bool(findings))


if __name__ == '__main__':
    sys.exit(main())
