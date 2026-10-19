#!/usr/bin/env sh
set -eu

: "${DB_HOST:?DB_HOST es obligatorio}"
: "${DB_PORT:?DB_PORT es obligatorio}"
: "${DB_NAME:?DB_NAME es obligatorio}"
: "${DB_USER:?DB_USER es obligatorio}"
: "${DB_PASSWORD:?DB_PASSWORD es obligatorio; carga la configuración E2E local}"
[ "$DB_USER" = tutorlink_e2e ] || { echo "E2E abortado: usuario de base no permitido." >&2; exit 1; }

case "$DB_HOST:$DB_PORT:$DB_NAME" in
  127.0.0.1:55433:tutorlink_e2e|localhost:55433:tutorlink_e2e) ;;
  *)
    echo "E2E abortado: se esperaba 127.0.0.1:55433/tutorlink_e2e (o localhost)." >&2
    exit 1
    ;;
esac

echo "Entorno E2E validado: PostgreSQL efímero local tutorlink_e2e."
