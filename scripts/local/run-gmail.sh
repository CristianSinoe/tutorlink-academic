#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
env_file="$repo_root/backend/.env.local"

if [[ ! -f "$env_file" ]]; then
  echo "Falta $env_file. Copia backend/.env.local.example y completa Gmail SMTP." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$env_file"
set +a

if [[ "${SPRING_PROFILES_ACTIVE:-}" != "local" ]]; then
  echo "SPRING_PROFILES_ACTIVE debe ser local; se rechazó el arranque." >&2
  exit 1
fi
if [[ "${DB_HOST:-}" != "localhost" && "${DB_HOST:-}" != "127.0.0.1" ]]; then
  echo "DB_HOST debe apuntar a PostgreSQL local; se rechazó el arranque." >&2
  exit 1
fi
if [[ "${DB_NAME:-}" != "tutorlink_local" || "${DB_PORT:-}" != "55432" ]]; then
  echo "La configuración local debe usar tutorlink_local en el puerto 55432." >&2
  exit 1
fi
if [[ "${TUTORLINK_MAIL_PROVIDER:-}" == "resend" || -n "${RESEND_API_KEY:-}" ]]; then
  echo "Resend no se permite en la ejecución local SMTP." >&2
  exit 1
fi

docker compose -f "$repo_root/docker-compose.local.yml" up --build
