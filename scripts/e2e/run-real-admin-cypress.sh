#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
ENV_FILE=${TUTORLINK_E2E_ENV_FILE:-"$ROOT/backend/.env.e2e.local"}
if [ ! -f "$ENV_FILE" ]; then echo "Falta $ENV_FILE; copia backend/.env.e2e.example fuera de Git." >&2; exit 1; fi
set -a; . "$ENV_FILE"; set +a
export SPRING_PROFILES_ACTIVE=demo,e2e
export TUTORLINK_CORS_ALLOWED_ORIGIN_PATTERNS="http://127.0.0.1:5173,http://localhost:5173"
"$ROOT/scripts/e2e/verify-environment.sh"

# Never run against a server left by another E2E run or a development terminal.
command -v setsid >/dev/null || { echo "E2E requiere setsid para gestionar sus procesos." >&2; exit 1; }
node --input-type=module <<'JS'
import net from 'node:net';
const results = await Promise.allSettled([5173, 8080].map(port => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', error => reject(new Error(`E2E abortado: no se puede reservar el puerto ${port} (${error.code}). Detén el servidor que lo ocupa y vuelve a intentar.`)));
  server.listen(port, '0.0.0.0', () => server.close(resolve));
})));
for (const result of results) {
  if (result.status === 'rejected') {
    console.error(result.reason.message);
    process.exitCode = 1;
  }
}
JS

umask 077
IPC_DIR=$(mktemp -d "${TMPDIR:-/tmp}/tutorlink-e2e-otp.XXXXXX")
export TUTORLINK_E2E_IPC_SOCKET="$IPC_DIR/otp.sock"
export TUTORLINK_E2E_IPC_TOKEN=$(openssl rand -hex 32)
# This capability is generated per run and is accepted only by the backend
# when both demo and e2e profiles are active. It never enters Vite/browser
# storage and replaces an unavailable external reCAPTCHA transport locally.
export TUTORLINK_E2E_RECAPTCHA_TOKEN=$(openssl rand -hex 32)
BACKEND_PID=""; FRONTEND_PID=""; CYPRESS_PID=""
cleanup() {
  trap '' INT TERM
  # Each server owns a session/process group, including Maven's Java child.
  [ -n "$CYPRESS_PID" ] && /bin/kill -TERM -- "-$CYPRESS_PID" 2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && /bin/kill -TERM -- "-$FRONTEND_PID" 2>/dev/null || true
  [ -n "$BACKEND_PID" ] && /bin/kill -TERM -- "-$BACKEND_PID" 2>/dev/null || true
  wait "$CYPRESS_PID" 2>/dev/null || true
  wait "$FRONTEND_PID" 2>/dev/null || true; wait "$BACKEND_PID" 2>/dev/null || true
  rm -rf "$IPC_DIR"
  docker compose -f "$ROOT/docker-compose.e2e.yml" down -v --remove-orphans
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

docker compose -f "$ROOT/docker-compose.e2e.yml" up -d db
# E2E owns this backend process. A clean compile prevents stale/partially
# written IDE bytecode (which can otherwise surface as ClassFormatError).
setsid sh -c 'cd "$1"; shift; exec "$@"' sh "$ROOT/backend" \
  mvn -o -DskipTests clean spring-boot:run > "$IPC_DIR/backend.log" 2>&1 & BACKEND_PID=$!
BACKEND_READY=false
for attempt in $(seq 1 60); do
  kill -0 "$BACKEND_PID" 2>/dev/null || break
  if [ -S "$TUTORLINK_E2E_IPC_SOCKET" ] && curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/api/auth/institutions | grep -Eq '401|403'; then BACKEND_READY=true; break; fi
  sleep 1
done
[ "$BACKEND_READY" = true ] || { tail -80 "$IPC_DIR/backend.log" >&2; exit 1; }
VITE_API_BASE_URL=http://127.0.0.1:8080 VITE_RECAPTCHA_SITE_KEY="$RECAPTCHA_SITE_KEY" \
  setsid sh -c 'cd "$1"; shift; exec "$@"' sh "$ROOT/frontend" \
  node node_modules/vite/bin/vite.js --host 127.0.0.1 > "$IPC_DIR/frontend.log" 2>&1 & FRONTEND_PID=$!
FRONTEND_READY=false
for attempt in $(seq 1 30); do
  kill -0 "$FRONTEND_PID" 2>/dev/null || break
  if curl -fsS http://127.0.0.1:5173/ >/dev/null 2>&1; then FRONTEND_READY=true; break; fi
  sleep 1
done
[ "$FRONTEND_READY" = true ] || { tail -80 "$IPC_DIR/frontend.log" >&2; exit 1; }
cd "$ROOT/frontend"
CYPRESS_REAL_E2E=true TUTORLINK_E2E_IPC_SOCKET="$TUTORLINK_E2E_IPC_SOCKET" TUTORLINK_E2E_IPC_TOKEN="$TUTORLINK_E2E_IPC_TOKEN" \
  setsid env -u ELECTRON_RUN_AS_NODE npx cypress run --browser electron --spec 'cypress/e2e/institution-admin.real.cy.js,cypress/e2e/academic.real.cy.js' \
  --env REAL_E2E=true,E2E_RECAPTCHA_TOKEN="$TUTORLINK_E2E_RECAPTCHA_TOKEN" & CYPRESS_PID=$!
wait "$CYPRESS_PID"
