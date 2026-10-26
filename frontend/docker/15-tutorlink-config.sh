#!/bin/sh
set -eu
case "${PORT:-}" in ''|*[!0-9]*) echo 'PORT debe ser numérico' >&2; exit 1;; esac
[ "$PORT" -ge 1024 ] && [ "$PORT" -le 65535 ] || { echo 'PORT fuera de rango' >&2; exit 1; }
# Only public, validated fields are serialized. No env dump or private key.
case "${VITE_API_BASE_URL:-}" in *[!A-Za-z0-9.:/-]*) echo 'Origen de API inválido' >&2; exit 1;; esac
case "${VITE_RECAPTCHA_SITE_KEY:-}" in *[!A-Za-z0-9_-]*) echo 'Clave pública inválida' >&2; exit 1;; esac
if [ -n "${VITE_API_BASE_URL:-}" ]; then
    printf '%s' "$VITE_API_BASE_URL" | grep -Eq '^https://[A-Za-z0-9.-]+(:[0-9]+)?/?$|^http://(localhost|127\.0\.0\.1)(:[0-9]+)?/?$' \
        || { echo 'VITE_API_BASE_URL requiere un origen HTTPS (HTTP solo para loopback local)' >&2; exit 1; }
fi
pending=false
if [ -z "${VITE_API_BASE_URL:-}" ] || [ -z "${VITE_RECAPTCHA_SITE_KEY:-}" ]; then
    pending=true
    echo 'Frontend disponible; conexión al backend/reCAPTCHA pendiente.'
fi
printf 'window.__TUTORLINK_CONFIG__ = {"apiBaseUrl":"%s","recaptchaSiteKey":"%s","deploymentPending":%s};\n' \
    "${VITE_API_BASE_URL:-}" "${VITE_RECAPTCHA_SITE_KEY:-}" "$pending" > /usr/share/nginx/html/runtime-config.js
