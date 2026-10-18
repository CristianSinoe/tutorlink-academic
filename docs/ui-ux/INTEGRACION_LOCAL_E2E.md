# Integración local E2E con PostgreSQL

Esta guía ejecuta React y Spring Boot contra recursos locales y efímeros. No usa `.env.demo`, `docker-compose.yml`, volúmenes persistentes, SMTP ni bases existentes.

## Preparación

Desde la raíz, iniciar únicamente el Compose dedicado:

```sh
docker compose -f docker-compose.e2e.yml up -d db
cp backend/.env.e2e.example backend/.env.e2e.local
set -a; . backend/.env.e2e.local; set +a
./scripts/e2e/verify-environment.sh
```

`docker-compose.e2e.yml` usa el proyecto `tutorlink-e2e`, PostgreSQL en `127.0.0.1:55433`, la base `tutorlink_e2e` y `tmpfs`, sin volumen nombrado. El script y el perfil `e2e` rechazan cualquier host, puerto o base distintos.

## Arranque y verificación

```sh
cd backend
SPRING_PROFILES_ACTIVE=demo,e2e mvn -o -DskipTests spring-boot:run

# en otra terminal
cd frontend
VITE_API_URL=http://127.0.0.1:8080 \
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI \
npm run dev -- --host 127.0.0.1
```

El perfil `demo` aplica Flyway V1–V30, valida JPA y ejecuta `DemoDataSeeder`. La semilla es idempotente: si ya existen las tres instituciones reservadas, no duplica filas. El perfil `demo-snapshot` conserva el flujo H2 histórico y no debe usarse para esta prueba.

El correo no sale del proceso: `InMemoryDemoMailSender` almacena temporalmente el mensaje de OTP sólo en memoria. No expone controlador HTTP, archivo, log, variable Vite ni credencial. La automatización E2E puede acceder a esa información exclusivamente mediante la tarea IPC local configurada para la batería; debe limpiar el buzón al finalizar.

Las credenciales sintéticas son los correos `admin1.demo15@example.invalid` a `admin3.demo15@example.invalid` y la contraseña configurada por `DEMO_PASSWORD` (el ejemplo emplea `TutorLinkDemo2026!`). Las claves reCAPTCHA del ejemplo son las oficiales de prueba de Google y no sustituyen controles de producción.

## Baterías y alcance

Primero se ejecutan las pruebas aisladas del frontend:

```sh
cd frontend
npm test
npm run lint
npm run build
```

La batería real debe ejecutarse con React y Spring Boot ya iniciados, sin `cy.intercept` para endpoints de negocio. Debe comprobar login/OTP, JWT contextual, cambio de institución, usuarios V30, perfiles, roles, membresías, invitaciones e importaciones; cada escritura se confirma con un GET posterior. Sus resultados se reportan por separado de Vitest y Cypress simulados.

### Cypress real y puente OTP

La ejecución reproducible usa un socket Unix, no HTTP:

```sh
cp backend/.env.e2e.example backend/.env.e2e.local
scripts/e2e/run-real-admin-cypress.sh
```

El script valida el datasource, crea un directorio temporal `0700`, genera un secreto aleatorio y lo entrega sólo al proceso Spring y al proceso Node de Cypress. Spring inicia el socket únicamente con los perfiles simultáneos `demo,e2e`; la tarea Node solicita `{email, otpToken, secret}`. El backend responde el código sólo cuando el desafío LOGIN sigue vigente, no está consumido, pertenece al correo indicado y coincide con el correo capturado en `DemoMailbox`.

No hay controlador HTTP, puerto, log, archivo persistente ni variable Vite para el OTP. Al detenerse, Spring borra el socket y el buzón; el script elimina el directorio temporal y el Compose efímero. Las specs `*.real.cy.js` no usan `cy.intercept`; las demás siguen siendo recorridos simulados y se reportan aparte.

## Resultados 2B.3.2

La ejecución real inicializada mediante `scripts/e2e/run-real-admin-cypress.sh` comprobó PostgreSQL efímero, Flyway V1–V30, siembra demo, CORS de `localhost` y `127.0.0.1`, OTP de un solo uso mediante socket Unix, JWT contextual y restauración React. La verificación reCAPTCHA queda descrita en la sección siguiente porque el entorno sin DNS requiere el transporte local efímero para esta batería.

### Transporte reCAPTCHA en la ejecución local

La primera ejecución real no pudo avanzar del login porque el proceso Spring intentó resolver `www.google.com` y el entorno Debian de pruebas no tenía salida DNS. Además, `e2e-local-test` no es un token emitido por Google. El orquestador genera ahora `TUTORLINK_E2E_RECAPTCHA_TOKEN` aleatorio para cada ejecución y lo pasa únicamente al proceso Spring y a Cypress. `RecaptchaService` acepta ese valor mediante una comparación constante solo cuando están activos simultáneamente los perfiles `demo,e2e` y la clave configurada es la clave secreta oficial de prueba de Google; fuera de esa combinación mantiene la verificación HTTPS contra Google y falla cerrado. El valor no entra en Vite, el navegador, localStorage, logs ni reportes.

Esto es un transporte de prueba local acotado al datasource protegido `tutorlink_e2e`; no es un bypass productivo ni sustituye la validación reCAPTCHA en perfiles normales. Si se requiere validar el widget de Google de extremo a extremo, debe ejecutarse en una terminal con DNS/salida HTTPS y conservarse la batería local como prueba reproducible sin dependencia externa.

La siguiente ejecución falló antes de abrir HTTP por un `ClassFormatError` en `com.sinoe.authmfa.domain.academic.Teacher`: el `target/classes` reutilizado contenía bytecode incompleto de una compilación incremental (su constructor incluía `Unresolved compilation problems`). `mvn clean compile` regeneró correctamente las 137 clases. El orquestador ejecuta ahora `mvn clean spring-boot:run` para que cada batería parta de bytecode íntegro y no reutilice artefactos parciales.

La spec real aprobada verifica el listado y filtro institucional, detalle, edición persistida de un perfil ESTUDIANTE y creación, lectura, reenvío y cancelación de invitaciones. Cada operación usa Spring Boot y PostgreSQL reales; no intercepta autenticación ni rutas de negocio. El entorno se destruye al finalizar.

Durante la ejecución se corrigió una carrera en el listado de usuarios: una respuesta inicial sin filtros podía sobrescribir la respuesta posterior filtrada. `InstitutionUsersPage` ahora descarta respuestas de consulta obsoletas.

Las pruebas Vitest y Cypress heredadas continúan siendo simuladas. Aún faltan recorridos reales separados para perfiles DOCENTE/TUTOR, roles combinados, suspensión/reactivación, CSV/XLSX, duplicados, cambio de institución y rechazo explícito de IDs entre instituciones. Por ello esta validación es parcial y no acredita todavía el inicio de la fase 2B.4.

### Actualización 2B.3.3

La batería real `institution-admin.real.cy.js` aprobó 5 recorridos contra React, Spring Boot y PostgreSQL efímero: perfil ESTUDIANTE con lectura posterior, perfiles DOCENTE y TUTOR con persistencia, suspensión y reactivación de membresía, rechazo HTTP 403 al leer o editar un usuario de otra institución, invitaciones y CSV parcialmente válido con resultados `INVITED`, `FAILED` y `SKIPPED`.

El CSV se construye en memoria durante Cypress con datos sintéticos y únicos por ejecución. No se usaron interceptores de negocio ni datos personales. Los recursos Docker, el socket Unix y el buzón se eliminaron al terminar cada ejecución.

Siguen pendientes pruebas reales para XLSX válido, revocación lógica, añadir simultáneamente DOCENTE y TUTOR a una cuenta inicialmente simple, duplicados ya presentes en la institución, cambio visual de contexto A→B y pruebas unitarias aisladas del socket para secreto erróneo, desafío inexistente, expirado, consumido, usuario ajeno, simultaneidad y limpieza. Hasta cubrirlas, la fase 2B.3 no se declara cerrada y no se recomienda iniciar 2B.4.

### Cierre 2B.3.4

La ejecución final de `scripts/e2e/run-real-admin-cypress.sh` pasó **9/9** escenarios contra React, Spring Boot y PostgreSQL efímero `tutorlink_e2e`: perfiles y membresías institucionales, aislamiento A/B, invitaciones, CSV parcial, XLSX válido, duplicados, combinación DOCENTE+TUTOR con revocación selectiva y cambio de contexto con JWT nuevo. Cada mutación se confirmó con una lectura posterior; no se usaron interceptores de negocio. El usuario global y las membresías de la otra institución permanecieron intactos.

| Escenario real | Resultado | Evidencia |
| --- | --- | --- |
| Listado, filtro y edición ESTUDIANTE | Aprobado | Cypress real, GET posterior |
| Perfiles DOCENTE y TUTOR, suspensión/reactivación | Aprobado | Cypress real, detalle V30 |
| Aislamiento y modificación desde otra institución | Aprobado | Respuestas HTTP 403 |
| Invitación: crear, listar, reenviar y cancelar | Aprobado | Estados persistidos, sin token visible |
| CSV válido/parcial/duplicado | Aprobado | Reporte `INVITED`, `FAILED`, `SKIPPED` y GET |
| XLSX válido | Aprobado | Reporte y invitación persistida por institución |
| Roles DOCENTE+TUTOR y revocación lógica | Aprobado | Ambos perfiles, DOCENTE `REVOKED`, TUTOR `ACTIVE` |
| Cambio A→B desde Mi perfil | Aprobado | JWT/contexto B, datos A rechazados con 403 |
| Puente IPC OTP | Aprobado | Pruebas JUnit: secreto, desafío, expiración, consumo, usuario, concurrencia y limpieza |

Durante el cierre se corrigieron únicamente los recorridos Cypress: selección del botón de alta de rol, espera del remontaje del detalle, desplazamiento de controles dentro del diálogo y alcance del botón de revocación. No se relajaron permisos ni aserciones del producto.

Las pruebas con mocks de Vitest y Cypress heredado siguen separadas de esta batería real. En el cierre: Vitest **89/89**, ESLint y build Vite aprobados; `E2eOtpIpcBridgeTest` **4/4**, `DemoSnapshotTest` **2/2** y `DemoPostgresIntegrationTest` omitida por la detección de Docker de Testcontainers (la cobertura PostgreSQL equivalente sí fue ejecutada por el script real). La batería Cypress real fue **9/9**. El aviso de Browserslist y el tamaño de chunk de Vite no afectan la ejecución. Una ejecución sin Docker se considera bloqueada y no sustituye esta validación real.

Con estos resultados, los seis grupos críticos pendientes quedaron comprobados contra React, Spring Boot y PostgreSQL efímero. La administración institucional V30 está suficientemente validada para comenzar la Fase 2B.4; los módulos de cursos y materias siguen fuera de este cambio.

## Inspección y limpieza

```sh
docker compose -f docker-compose.e2e.yml ps
docker compose -f docker-compose.e2e.yml exec db psql -U tutorlink_e2e -d tutorlink_e2e
docker compose -f docker-compose.e2e.yml down -v --remove-orphans
```

Detener Spring Boot y Vite antes de la limpieza. `down -v` afecta exclusivamente los recursos con proyecto `tutorlink-e2e`; la base desaparece junto con el `tmpfs`. Nunca se debe cambiar el host, puerto o nombre de esta guía para apuntar a un datasource de desarrollo o producción.

## Fase 2B.4: batería académica

La spec `frontend/cypress/e2e/academic.real.cy.js` se ejecuta junto a la spec administrativa mediante `scripts/e2e/run-real-admin-cypress.sh`. Usa el mismo socket OTP y la misma base efímera; no intercepta autenticación ni operaciones de negocio. El recorrido crea un periodo, un curso y un grupo con sufijo único, obtiene perfiles DOCENTE/ESTUDIANTE reales desde el listado institucional, asigna e inscribe, confirma las relaciones mediante GET, inicia sesión en los dos espacios, retira la inscripción y comprueba `WITHDRAWN` y la desaparición de la materia del listado estudiantil. También prueba duplicado docente y acceso de un ADMIN de otra institución.

| Escenario | Resultado esperado | Evidencia | Estado de esta ejecución |
| --- | --- | --- | --- |
| Periodo, curso y grupo | `201`, lectura posterior y nombres de catálogo | Cypress real + GET académico | Pendiente de ejecutar con Docker |
| Asignación docente | `204`, docente visible por lectura administrativa | GET `/groups/{id}/teachers` | Pendiente de ejecutar con Docker |
| Inscripción y retiro | `204`, `ACTIVE` → `WITHDRAWN`, historial conservado | GET de enrollments | Pendiente de ejecutar con Docker |
| Mis materias DOCENTE/ESTUDIANTE | grupo visible solo mientras la relación está vigente | GET role-specific + UI | Pendiente de ejecutar con Docker |
| Duplicado y aislamiento A/B | `409` en duplicado y `403` en institución ajena | HTTP real | Pendiente de ejecutar con Docker |

Vitest y Cypress con mocks siguen siendo evidencia de componentes y contrato simulado; no sustituyen esta matriz real. Las pruebas HTTP H2 del backend sí se ejecutan localmente y cubren sanitización, paginación, estados y aislamiento del grupo. Si el daemon Docker/Testcontainers no está disponible, se informa la batería PostgreSQL como omitida y la Fase 2B.4 no se declara validada de extremo a extremo.

### Diagnóstico de la ejecución Codex — Fase 2B.4.1

La ejecución dentro de Codex no pudo iniciar la batería real por una restricción del sandbox. No había un proceso escuchando en 5173 (`curl http://127.0.0.1:5173` devolvió conexión rechazada), pero un servidor Node mínimo devolvió `EPERM: listen EPERM` al intentar enlazar `127.0.0.1:5173`. Vite reprodujo exactamente el mismo error en 5173 y en el puerto alternativo 5174, por lo que no es una colisión de puertos ni un problema de `strictPort`. El script usa `npm run dev -- --host 127.0.0.1`, con `VITE_API_BASE_URL` y CORS coherentes; no se modificó esa configuración.

La comprobación de entorno E2E sí pasó (`127.0.0.1:55433/tutorlink_e2e`), pero el daemon Docker tampoco fue accesible desde este sandbox (`permission denied ... /var/run/docker.sock`). Por consiguiente, no se iniciaron PostgreSQL, Spring Boot ni Cypress real en esta ejecución. Las pruebas H2, Vitest, lint y build siguen siendo evidencia separada y no sustituyen el recorrido PostgreSQL.

Para reproducirlo en una terminal Debian local con permisos de usuario para Docker:

```sh
cd ~/TUTORLINK
set -a; . backend/.env.e2e.local; set +a
./scripts/e2e/verify-environment.sh
docker compose -f docker-compose.e2e.yml up -d db
scripts/e2e/run-real-admin-cypress.sh
```

El script inicia el backend `demo,e2e`, Vite en `127.0.0.1:5173` y las specs reales administrativa y académica, y limpia únicamente el proyecto Compose efímero, el socket OTP y el directorio temporal. Si el usuario pertenece al grupo `docker`, no se requiere ejecutar Maven, Vite ni Cypress como root. Si la política local no concede escucha o acceso al socket, debe corregirse esa política de la máquina de desarrollo; no se debe relajar el código de seguridad ni cambiar el datasource.
