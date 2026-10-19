# TutorLink

Backend Spring Boot 3 / Java 17, frontend React / Vite y PostgreSQL 16. Las pruebas locales usan exclusivamente cuentas sintéticas y una base E2E efímera; no requieren credenciales personales ni conexión a producción.

## Requisitos

- Debian/Linux con Docker Engine y Compose v2 accesibles por el usuario, sin ejecutar Maven/Cypress como root.
- Java 17 y Maven 3.9; Python 3 para preparar configuración y revisar secretos.
- Node.js según `.nvmrc` (20.19.5) y npm. Si utilizas nvm: `nvm install && nvm use`.
- Dependencias Linux de Electron/Cypress. Ante una biblioteca ausente, consultar el diagnóstico de `npx cypress verify`.

## Preparar una copia nueva

```sh
# Desde la raíz de este repositorio
python3 scripts/e2e/prepare-local.py
cd frontend
npm ci
npx cypress verify
cd ../backend
# Descarga dependencias con red antes de usar el runner offline.
mvn -DskipTests package dependency:go-offline
cd ..
python3 scripts/check-secrets.py
```

La preparación crea `backend/.env.e2e.local` privado (0600), con contraseña de base y secreto JWT aleatorios y configuración de prueba. No sobrescribe un archivo existente. El runner actual utiliza Maven offline (`-o`): si falta un artefacto, completa su descarga con Maven en línea antes de repetir. No cambies a una base externa para resolverlo.

## E2E reales: React → Spring Boot → PostgreSQL

Detén tus servidores de desarrollo en **5173/8080**; PostgreSQL E2E requiere **55433** libre.

```sh
./scripts/e2e/run-real-admin-cypress.sh
```

El script carga la configuración privada, comprueba el datasource `tutorlink_e2e`, inicia PostgreSQL efímero, aplica Flyway, siembra datos sintéticos, inicia Spring Boot/Vite y ejecuta las specs reales administrativa y académica. No simula respuestas de negocio. Autentica mediante API real y OTP por socket Unix; no expone OTP por HTTP. Al terminar elimina únicamente sus procesos y recursos Compose E2E. La clave/capacidad local de reCAPTCHA no verifica visualmente el widget Google.

Resultado de referencia del 19/10/2026: **10/10 pruebas reales aprobadas**. Los resultados de una ejecución nueva son los que determine su salida, no esta referencia. Vídeos locales en `frontend/cypress/videos/`; capturas de fallos en `frontend/cypress/screenshots/`. No versionar estos artefactos ni compartirlos sin revisar datos sensibles.

## Pruebas frontend y Cypress con mocks

```sh
cd frontend
npm test
npm run lint
npm run build
```

Para las specs simuladas, en una terminal:

```sh
cd frontend
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

En otra terminal:

```sh
cd frontend
env -u ELECTRON_RUN_AS_NODE npx cypress run --browser electron \
  --config 'baseUrl=http://127.0.0.1:5174,excludeSpecPattern=**/*.real.cy.js'
```

Referencia: **48/48 pruebas con mocks** el 19/10/2026. Detener el Vite de esa terminal con `Ctrl+C`. No confundir estos resultados con las pruebas reales ni con sesiones de usabilidad con personas.

## Pruebas backend

```sh
cd backend
mvn test
```

Algunas integraciones usan Testcontainers y necesitan Docker. Revisar los resultados Surefire y las pruebas omitidas; una omisión no equivale a aprobación. Esta suite es independiente del entorno E2E orquestado.

## Desarrollo persistente con Compose (opcional)

Para E2E utiliza siempre el script anterior. Para el stack de desarrollo persistente:

1. Copia `.env.example` a `.env` y define una contraseña local aleatoria (`openssl rand -hex 32`).
2. Copia `backend/.env.example` a `backend/.env.docker`; configura JWT, reCAPTCHA y correo **de desarrollo**. Sustituye todos los placeholders; mantén bootstrap y alta automática de ADMIN desactivados salvo un procedimiento explícito.
3. Ejecuta `docker compose up --build`. La contraseña de `.env` se comparte entre PostgreSQL y backend; los valores privados no están en Git. Conserva la configuración de volúmenes existentes: cambiar una variable no rota contraseñas ya persistidas.

Frontend: `http://localhost:5173`; backend: `http://localhost:8080`. `VITE_API_BASE_URL` vacío conserva la autodetección del host. Nunca poner secretos en `VITE_*`. Para acceso LAN, configurar `FRONTEND_BASE_URL` y CORS conscientemente; en producción restringir orígenes y utilizar configuración propia, sin perfiles demo.

## Documentación

- [Integración E2E: escenarios, límites y reproducción](docs/ui-ux/INTEGRACION_LOCAL_E2E.md)
- [Contrato de API](docs/CONTRATO_API_CURSOS.md)
- [Configuración privada y revisión antes de publicar](SECURITY.md)
- [Sistema de diseño](docs/ui-ux/SISTEMA_DISENO.md)
