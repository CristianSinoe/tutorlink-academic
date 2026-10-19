#!/usr/bin/env python3
"""Create private E2E configuration without overwriting existing local secrets."""
import os
from pathlib import Path
import secrets
import sys

ROOT = Path(__file__).resolve().parents[2]
TARGET = ROOT / "backend/.env.e2e.local"


def main():
    if TARGET.exists():
        print("La configuración E2E local ya existe; no se modificó.")
        return 0
    template = (ROOT / "backend/.env.e2e.example").read_text()
    # Public Google test fixture, already used by RecaptchaService. Never a
    # personal/production secret. The E2E runner generates its own capability.
    values = {
        "DB_PASSWORD": secrets.token_hex(32),
        "SECURITY_JWT_SECRET": secrets.token_hex(32),
        "RECAPTCHA_SECRET_KEY": "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe",
    }
    lines = [f"{line.split('=', 1)[0]}={values[line.split('=', 1)[0]]}"
             if '=' in line and line.split('=', 1)[0] in values else line
             for line in template.splitlines()]
    try:
        descriptor = os.open(TARGET, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:
        print("La configuración E2E local ya existe; no se modificó.")
        return 0
    with os.fdopen(descriptor, "w") as output:
        output.write('\n'.join(lines) + '\n')
    print("Configuración E2E local creada con permisos 0600; valores privados ocultos.")
    return 0


if __name__ == '__main__':
    sys.exit(main())
