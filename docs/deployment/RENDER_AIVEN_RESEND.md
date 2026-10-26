# Despliegue por imágenes Docker: Render + Aiven + Resend

Estado: preparación de código/configuración; no demuestra despliegue, conexión Aiven ni entrega real de correo hasta ejecutar las comprobaciones con los servicios propios. Las direcciones `app.tutorlink.lat` y `api.tutorlink.lat` son propuestas: sustituir por los dominios realmente configurados, incluidos los `onrender.com` de Render si se prefieren. El remitente solicitado es `TutorLink <noreply@tutorlink.lat>`.

### Publicar primero el backend

Se puede crear y desplegar primero el servicio backend. Sin embargo, la guarda actual de `prod` exige desde el arranque un par reCAPTCHA real, la CA de Aiven accesible y un origen HTTPS previsto para `FRONTEND_BASE_URL`, incluido exactamente en CORS. El frontend no necesita estar publicado todavía para configurar su dirección futura, pero `http://localhost:5173` y los comodines locales bloquean el arranque productivo. No se deben desactivar las guardas para evitar este requisito. Las invitaciones y el login en navegador se validan una vez que el frontend esté disponible.

Antes de copiar variables, comprobar que cada nombre aparece una sola vez: una asignación local al final del `.env` sobrescribe los datos Aiven anteriores al usar `source`. Las claves reCAPTCHA oficiales de prueba tampoco son válidas en `prod`. Los datos de la base/usuario deben coincidir con los realmente creados en Aiven; no asumir nombres de desarrollo. Si una captura compartida muestra una contraseña, rotarla en el proveedor y actualizar las copias privadas antes del despliegue. No copiar el respaldo privado de configuración a Render ni a la imagen.

### Frontend publicado primero — 24/10/2026

Imagen publicada en Docker Hub: **`docker.io/sinoeruiz/tutorlink-frontend:render-20261024-1`**, plataforma `linux/amd64`.

Digest del manifiesto: `sha256:f2151377ed3b9f84e710aca34749d9c440f5b47e28b258668533f2aee553299d`.

Para desplegarla, crear un **Web Service → Existing Image**, introducir esa referencia y usar `/healthz` como Health Check Path. Conservar el comando predeterminado y el `PORT` proporcionado por Render. No cargar credenciales del backend en este servicio.

Esta versión permite iniciar sin `VITE_API_BASE_URL` y/o `VITE_RECAPTCHA_SITE_KEY`: muestra «Frontend disponible» y conexión pendiente, sin montar autenticación ni consumidores de API. No crea URLs ficticias ni concede acceso. Los valores no vacíos siguen validándose; una URL de API mal formada no se convierte silenciosamente en configuración válida. Este modo permite obtener la URL HTTPS pública del frontend antes de publicar el backend.

Después de disponer de esa URL, configurar en el backend `FRONTEND_BASE_URL` y `TUTORLINK_CORS_ALLOWED_ORIGIN_PATTERNS` con el origen HTTPS exacto, sin barra final ni comodines. Completar el par reCAPTCHA real autorizado para el hostname del frontend, CA, Resend y demás requisitos. Tras publicar el backend, agregar al servicio frontend `VITE_API_BASE_URL=https://URL-REAL-DEL-BACKEND` (sin `/api`) y `VITE_RECAPTCHA_SITE_KEY` pública, y volver a desplegar la **misma imagen**. No se requiere reconstruirla: al arrancar, Nginx genera `runtime-config.js` con esos dos valores públicos y `deploymentPending=false`.

Verificación de esta publicación: **128/128 Vitest**, ESLint y build aprobados; imagen construida y push completado. Dos contenedores efímeros verificaron arranque pendiente y configurado, puerto 10000, healthcheck, recarga de rutas SPA, assets inexistentes 404, runtime sin caché, usuario no root y ausencia de las claves privadas del `.env` backend en los archivos publicados. El chequeo de secretos de archivos versionados no reportó hallazgos. No se desplegó ningún servicio Render ni se probó todavía el login/CORS entre URLs públicas; esa validación queda pendiente de conocer ambas direcciones.

### Backend publicado y origen frontend confirmado — 24/10/2026

Frontend real: **`https://tutorlink-frontend-render-20261024-1.onrender.com`**. Su `/healthz` respondió HTTP 200. `backend/.env` y la plantilla de Render usan ese origen exacto tanto en `FRONTEND_BASE_URL` como en `TUTORLINK_CORS_ALLOWED_ORIGIN_PATTERNS`, sin barra final, localhost ni comodines. El archivo privado no se carga automáticamente en Render: copiar sus valores a Environment.

Imagen backend publicada: **`docker.io/sinoeruiz/tutorlink-backend:render-20261024-1`**, `linux/amd64`. Digest: `sha256:7a1bc86d76fcc424af7ead8faa88987bedc7cb3f3566cbbc20efc4ed41325aa2`. Crear un segundo Web Service con Existing Image; healthcheck **`/api/health`**, comando predeterminado y `PORT` de Render. Cargar la CA como Secret File `aiven-ca.pem` y las variables privadas solo en este servicio.

Pendientes operativos detectados: el `.env` revisado todavía usa las claves oficiales reCAPTCHA de prueba, rechazadas por `prod`. Sustituir **ambas** por un par real de reCAPTCHA v2 para el hostname del frontend, sin protocolo ni ruta en la consola Google. Comprobar que la contraseña expuesta antes fue rotada y actualizada. No se validaron contra los proveedores la contraseña Aiven, la clave Resend ni el dominio remitente. Tampoco se aprovisionó una primera cuenta administrativa ni se aplicaron migraciones contra Aiven real.

La imagen backend pasó un smoke con PostgreSQL TLS desechable: arranque `prod`, 30 migraciones, ausencia de cuentas demo, usuario no root, CORS desde el origen Render real y rechazo de otro origen. Se probó OPTIONS de `/api/teacher/tasks` con POST y encabezados `Authorization`/`Content-Type`. El origen representa el encabezado del navegador; estas pruebas locales no sustituyen el recorrido entre los dos servicios públicos una vez desplegado el backend. Se inspeccionó el JAR sin detectar `.env` ni claves privadas reales. La constante pública de Google utilizada por E2E se reconoce separadamente y la guarda impide usarla en producción. Pruebas de configuración **4/4** y comprobaciones Python **4/4** aprobadas; no se enviaron correos ni se contactó Aiven.

Reproducción del smoke sin secretos reales:

```sh
SMOKE_BACKEND_IMAGE=sinoeruiz/tutorlink-backend:render-20261024-1 \
SMOKE_FRONTEND_IMAGE=sinoeruiz/tutorlink-frontend:render-20261024-1 \
SMOKE_FRONTEND_ORIGIN=https://tutorlink-frontend-render-20261024-1.onrender.com \
python3 scripts/production/smoke-images.py
```

Tras obtener la URL HTTPS del backend, actualizar **en el servicio frontend de Render** `VITE_API_BASE_URL` (origen del backend sin `/api`) y `VITE_RECAPTCHA_SITE_KEY` (la clave pública del par real). Volver a desplegar la misma imagen frontend; no necesita reconstrucción. Comprobar entonces login/OTP, preflight, invitaciones y avisos con cuentas autorizadas. No usar `*` para resolver errores CORS.

### Conectar el frontend al backend activo — 24/10/2026

Backend real: **`https://tutorlink-backend-render-20261024-1.onrender.com`**. El log de Render confirmó las 30 migraciones y el arranque; una comprobación HTTPS externa de `/api/health` respondió 200 con `ok`. El preflight OPTIONS de `/api/auth/login` aceptó POST y los encabezados Content-Type/Authorization desde el origen exacto del frontend, devolviendo `Access-Control-Allow-Origin` correcto; un origen ajeno devolvió 403 sin ese encabezado. No se enviaron credenciales ni correos en estas comprobaciones.

`frontend/.env` y la plantilla ahora apuntan al backend real. El archivo local conserva únicamente la clave pública reCAPTCHA del par configurado en el backend local; no se copian claves privadas. Para activar el servicio desplegado, abrir **Render → servicio FRONTEND → Environment** y establecer:

```text
VITE_API_BASE_URL=https://tutorlink-backend-render-20261024-1.onrender.com
VITE_RECAPTCHA_SITE_KEY=<clave publica real del mismo registro que usa el backend>
```

Guardar y volver a desplegar la misma imagen `sinoeruiz/tutorlink-frontend:render-20261024-1`. El `.env` local no cambia las variables del servicio remoto. La comprobación previa del `runtime-config.js` público seguía mostrando API vacía y `deploymentPending=true`; esto se resuelve al reiniciar con las variables correctas. No se dispone en esta sesión de acceso a la API/CLI de Render para modificar remotamente ese Environment.

Después del despliegue, comprobar que `runtime-config.js` contiene la API real y `deploymentPending=false`, y que aparece el login. La disponibilidad HTTP y CORS no acreditan todavía autenticación/OTP real ni aprovisionamiento de la primera cuenta administrativa; esos recorridos permanecen pendientes.

### Cuentas iniciales aprovisionadas — 24/10/2026

Con autorización explícita del propietario se crearon dos cuentas nuevas en Aiven: un ADMIN con membresía activa en la única institución existente, `TutorLink Legacy` (`TUTORLINK_LEGACY`), y un SUPER_ADMIN de plataforma sin membresías institucionales añadidas. Se comprobó previamente que ninguno de los correos existía; no se sobrescribieron ni escalaron cuentas existentes. Los correos concretos y contraseñas están únicamente en `backend/.env.initial-admin.local`, privado, con permisos 0600 e ignorado por Git y Docker. **No cargar ese archivo en Render ni publicar su contenido.**

El aprovisionamiento se probó primero en PostgreSQL efímero con el esquema V1–V30: creación, BCrypt, membresía, rol de plataforma, auditoría y rechazo de ejecución duplicada. La operación real usó TLS `verify-full`, transacción y auditoría; una lectura posterior confirmó las dos cuentas ACTIVE y que las contraseñas generadas coinciden con sus hashes BCrypt `$2a$10$`. No se enviaron correos ni se efectuó un login con las nuevas credenciales. No hubo modificaciones de migraciones, endpoints ni controles de seguridad.

El ADMIN entra por `/login` y selecciona `TutorLink Legacy` durante el flujo institucional. El SUPER_ADMIN usa **Acceso de plataforma**, `/login?access=platform`. Ambos conservan OTP obligatorio. No es necesario reconstruir imágenes, reiniciar servicios ni activar `APP_SEED_ADMIN_ENABLED`/`ADMIN_BOOTSTRAP_ENABLED`; ambos permanecen `false`. El envío y consumo de OTP con las nuevas cuentas y la navegación autenticada completa siguen pendientes de la prueba manual del propietario.

## 1. Servicios y secretos

Crear dos **Web Services de Render con Existing Image**, uno para Spring Boot y otro para Nginx/React. Al elegir imagen Docker para el frontend se consume un servicio web; no equivale al producto gratuito Render Static Site. Aiven aloja PostgreSQL por separado. Resend recibe solicitudes HTTPS exclusivamente desde el backend.

Las plantillas están en [backend.env.example](../../deploy/render/backend.env.example) y [frontend.env.example](../../deploy/render/frontend.env.example). Son listas de campos, no credenciales. En Render escribir los valores sin comillas de shell. Si se preparan copias privadas locales, usar nombres `.env.backend.local`/`.env.frontend.local` y permisos 0600. No publicar capturas de Environment, logs de solicitudes, HAR ni archivos de certificados privados.

| Campo backend | Valor que debe aportar el operador |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `prod`, sin demo, dev, snapshot, test ni e2e |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Datos de conexión de la base Aiven destinada a este despliegue |
| `DB_SSL_ROOT_CERT` | `/etc/secrets/aiven-ca.pem` |
| `DB_POOL_MAX` | 5 inicialmente; ajustar al límite real de conexiones de Aiven y número de instancias |
| `SECURITY_JWT_SECRET` | Secreto aleatorio estable del entorno, por ejemplo `openssl rand -hex 32`; almacenarlo en Render, no Git |
| `RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` | Par real para los dominios del frontend; las claves oficiales de prueba se rechazan en prod |
| **`RESEND_API_KEY`** | **Aquí se carga la API key privada de Resend. Solo en el backend. Nunca `VITE_RESEND_API_KEY`.** |
| `RESEND_FROM_EMAIL` | `TutorLink <noreply@tutorlink.lat>`; también es el valor por defecto |
| `FRONTEND_BASE_URL` | Origen HTTPS final, sin barra final ni ruta; se usa en invitaciones/activación |
| `TUTORLINK_CORS_ALLOWED_ORIGIN_PATTERNS` | Lista separada por comas de orígenes HTTPS exactos autorizados; debe incluir el frontend |
| `APP_SEED_ADMIN_ENABLED`, `ADMIN_BOOTSTRAP_ENABLED` | `false` |

Frontend: `VITE_API_BASE_URL` es el origen HTTPS del backend, sin `/api` añadido; `VITE_RECAPTCHA_SITE_KEY` es la clave pública correspondiente. Nginx genera `/runtime-config.js` al arrancar; la misma imagen sirve para diferentes entornos sin reconstruirla. Este archivo es público y no se cachea. No copiar JWT, contraseñas, key de Resend ni datos de Aiven al frontend.

Render proporciona `PORT`; ambas imágenes lo respetan. El frontend admite 1024–65535 y tiene 8080 como valor local por defecto. No sobrescribir Docker Command salvo necesidad comprobada.

## 2. Aiven y migraciones

1. Crear o seleccionar explícitamente la base **del entorno de destino**. Antes de migrar una base existente, obtener respaldo recuperable y revisar su historial Flyway. No reutilizar la base E2E ni datos sintéticos en producción.
2. Descargar el certificado **CA público** de ese servicio Aiven desde su consola. En Render backend crear un **Secret File** llamado `aiven-ca.pem`, que quedará en `/etc/secrets/aiven-ca.pem`. No subirlo dentro de la imagen ni copiar claves privadas. El archivo debe poder leerlo el usuario no root del contenedor.
3. Copiar los datos PostgreSQL al backend; mantener el hostname original de Aiven, porque `verify-full` comprueba también el nombre del servidor. Si Aiven tiene restricciones IP, permitir únicamente las salidas necesarias del backend según su región de Render.
4. `prod` usa PostgreSQL con `sslmode=verify-full`, CA explícita, pool inicial pequeño, Flyway activo, `baseline-on-migrate=false` y JPA `validate`. No genera ni actualiza tablas con Hibernate. Flyway aplica las migraciones existentes V1–V30; no se modificaron.
5. Para un esquema existente sin historial Flyway, detener y revisar un baseline controlado; **no** activar baseline automático ni borrar tablas para conseguir el arranque. El primer despliegue requiere permisos DDL de migración suficientes. Las instancias deben usar la misma versión durante la migración.

No se crean cuentas ni instituciones demo en prod. Debe existir o provisionarse mediante un procedimiento administrativo controlado la primera cuenta global y las instituciones/membresías autorizadas. No activar bootstrap dev ni inventar un administrador predeterminado. La preparación no migra usuarios reales ni aprovisiona automáticamente esa primera cuenta.

## 3. Resend: dominio y transporte

1. Verificar `tutorlink.lat` en la cuenta Resend con los registros DNS requeridos por su consola. Añadir autenticación SPF/DKIM y una política DMARC apropiada, sin romper registros existentes. Si se verifica solo un subdominio, cambiar el remitente para que pertenezca exactamente a ese dominio autorizado.
2. Crear una API key con el mínimo permiso de envío y el alcance de dominio que permita la cuenta. Copiarla al campo backend **RESEND_API_KEY**. Pagar un plan no sustituye la verificación del dominio.
3. El SDK se fija en **resend-java 4.11.0**, compatible con las clases utilizadas y Java del proyecto. Configuración YAML equivalente a la propuesta del usuario: `resend.api-key=${RESEND_API_KEY}` y `resend.from-email=TutorLink <noreply@tutorlink.lat>`.
4. `ResendMailSender` adapta la interfaz `JavaMailSender` que ya usan `EmailService` y `MailService`. Se preservan OTP, caducidad/consumo/intentos, invitaciones, activación, recuperación/cambio de contraseña y avisos existentes de consultas/tutorías. El envío en prod va por HTTPS, sin SMTP. Desarrollo SMTP y demo/E2E conservan su transporte.
5. El adaptador soporta texto/HTML y alternativas multipart de las plantillas existentes; no implementa envío de archivos adjuntos ni CC/BCC. No se añaden endpoints de envío arbitrario ni nuevos disparadores de alertas de cursos/tareas/actividades pendientes de implementación.
6. Un ID de Resend significa **solicitud aceptada**, no entrega confirmada. Revisar el panel Resend para entrega, rebotes y rechazos. No se añadieron webhooks, cola/outbox ni reintentos automáticos de aplicación; un fallo de resultado incierto no debe reintentarse a ciegas. Las operaciones de negocio conservan su manejo de errores actual.

Los errores del proveedor se convierten en un fallo sanitizado sin incluir cuerpo del correo, OTP, destinatarios ni API key. Los logs de correo ya no imprimen destinatarios o excepciones del proveedor.

## 4. Construir y publicar imágenes

Desde la raíz con Docker/Buildx y acceso a un registro propio. Ejecutar primero las pruebas del apartado 6. No se requieren secretos productivos para construir las imágenes.

```sh
# Sustituir usuario y etiqueta. Conservar el digest producido por el registro.
REGISTRY=ghcr.io/tu-usuario
TAG=prod-2026-10-22

docker buildx build --platform linux/amd64 --load \
  -t "$REGISTRY/tutorlink-backend:$TAG" backend
docker buildx build --platform linux/amd64 --target production --load \
  -t "$REGISTRY/tutorlink-frontend:$TAG" frontend

# Autenticarse en el registro sin poner tokens como argumentos de terminal.
# Estos push publican las imágenes; ejecutarlos cuando corresponda.
docker push "$REGISTRY/tutorlink-backend:$TAG"
docker push "$REGISTRY/tutorlink-frontend:$TAG"
```

Usar un registro privado si las imágenes no deben publicarse. En Render configurar la credencial de solo lectura del registro privado; es distinta de RESEND_API_KEY. Seleccionar imágenes Linux amd64 compatibles y, preferiblemente, fijar cada despliegue por digest. Las imágenes usan usuarios no root. El backend empaqueta con Maven; el frontend compila con Vite y sirve mediante Nginx, sin `npm run dev` en producción.

`docker compose up` del desarrollo sigue usando el target `development` del frontend; no convierte el stack local en prod.

## 5. Configurar los dos servicios Render

1. Backend Existing Image: conectar la imagen, cargar variables y CA; elegir región cercana a Aiven. Health Check Path: `/api/health`.
2. Frontend Existing Image: conectar su imagen, cargar las dos variables públicas; Health Check Path: `/healthz`. Configurar un primer dominio/URL final del frontend y actualizar CORS/FRONTEND_BASE_URL del backend antes de probar login.
3. Configurar los dominios propios y certificados HTTPS en Render si se usan; pueden coexistir con el dominio remitente Resend mediante registros DNS diferentes.
4. Configurar reCAPTCHA real para esos dominios y comprobar la clave pública en ambos servicios.
5. Para el piloto evitar un backend que duerma por inactividad; presupuestar además el Web Service del frontend si se aloja como Docker. No asumir que la cuota de Resend cubre Render/Aiven/dominio.

No se incluyó un render.yaml con nombres/credenciales o tags inventados. Se utiliza el flujo Existing Image solicitado y se documentan los campos reales.

## 6. Verificación y aceptación

```sh
python3 scripts/check-secrets.py
python3 -m unittest discover -s scripts/tests -v
mvn -f backend/pom.xml test
cd frontend
npm ci
npm test
npm run lint
npm run build
```

Antes de habilitar participantes:

- `/api/health` responde `ok`, `/healthz` responde `ok`; las rutas React profundas recargan correctamente y un asset inexistente no devuelve HTML.
- La revisión del arranque confirma Flyway/JPA sin errores; verificar que no se crearon usuarios demo ni se expusieron previsualizaciones dev o socket OTP.
- El frontend usa HTTPS y el backend esperado. Probar CORS desde el origen autorizado y rechazo de un origen ajeno; confirmar que el navegador nunca recibe credenciales de Resend/Aiven.
- Con una cuenta de prueba autorizada, solicitar OTP, comprobar su recepción real, verificarlo y rechazar su reutilización. Revisar expiración/reenvío sin imprimir códigos. La aceptación del SDK o pruebas con mocks no sustituyen la entrega real.
- Probar una invitación y los avisos existentes de consultas/tutorías con destinatarios controlados, así como un fallo recuperable de correo. No afirmar que los avisos de nuevos módulos ya existen.
- Confirmar aislamiento institucional y roles con los flujos actuales. Mantener la batería E2E efímera separada de Aiven; nunca ejecutar el seeder E2E contra producción.
- Comprobar respaldo/recuperación y la primera cuenta administrativa antes de abrir el piloto.

Publicar imágenes y cambiar DNS/servicios se hace después de la revisión; esta ejecución prepara y verifica localmente, sin despliegue externo ni envío de correo sin autorización de destinatarios.

Referencias: [Render Existing Image](https://render.com/docs/deploying-an-image), [Docker en Render](https://render.com/docs/docker), [Aiven PostgreSQL/Java](https://aiven.io/docs/products/postgresql/howto/connect-java), [Resend Java](https://resend.com/docs/send-with-java), [dominios Resend](https://resend.com/docs/dashboard/domains/introduction).

## 7. Evidencia local — 22/10/2026

| Comprobación | Resultado efectivo |
| --- | --- |
| Suite backend completa, última ejecución | **298 aprobadas**, 0 fallos, 0 errores, 0 omitidas; incluye PostgreSQL/Testcontainers |
| Vitest | **110 aprobadas** en 24 archivos |
| ESLint y build Vite | Aprobados; permanece aviso de tamaño de chunk y antigüedad de Browserslist |
| Cypress contra imagen Nginx, con API simulada | **48/48 aprobadas**, 11 specs |
| Pruebas Python de configuración privada | **4/4 aprobadas** |
| Imágenes backend/frontend | Construidas localmente como `tutorlink-production-backend:local` y `tutorlink-production-frontend:local` |
| Smoke de imágenes con PostgreSQL TLS desechable | Aprobado: perfil prod, 30 migraciones, TLS, CORS permitido/denegado, sin cuentas demo, usuarios no root, PORT, SPA, assets 404 y runtime público no cacheado |
| Aiven/Resend/reCAPTCHA externos | **No ejecutados**: requieren servicios, dominio y secretos reales del operador; no se enviaron correos |

Para repetir el smoke aislado (requiere Docker, Python 3 y OpenSSL; nunca usa datos Aiven ni secretos productivos):

```sh
docker build -t tutorlink-production-backend:local backend
docker build --target production -t tutorlink-production-frontend:local frontend
python3 scripts/production/smoke-images.py
```

El script crea red/containers con sufijo aleatorio y PostgreSQL en tmpfs, usa un certificado efímero **solo de prueba**, verifica los resultados y elimina contenedores/red/certificado/configuración temporal al terminar. Las imágenes se conservan para revisión. No sustituye el certificado CA de Aiven ni confirma entrega externa.

Los logs locales de esta ejecución están en `/tmp/tutorlink-prod-backend-final.log`, `/tmp/tutorlink-prod-frontend.log`, `/tmp/tutorlink-prod-cypress-final.log` y `/tmp/tutorlink-prod-smoke.log`; son temporales y no se versionan. Las pruebas de correo usan un emisor simulado para inspeccionar opciones del SDK; la prueba de imágenes no solicita correos.

Defectos/correcciones encontrados durante la preparación: materialización MIME antes de convertir HTML/multipart; sanitización de errores genéricos; descarga innecesaria del navegador Cypress dentro del build frontend; predescarga Maven excesiva sustituida por empaquetado con caché. La primera configuración de navegador usó un puerto reservado; después un origen remoto inexistente introdujo dependencias de preflight/DNS en mocks. La ejecución final aisló el origen simulado en el propio Nginx y añadió una espera explícita de restauración de contexto en la spec del sidebar, sin cambiar autenticación ni reducir aserciones. CORS real sí se comprobó por separado contra el backend del smoke TLS.

Pendientes operativos para el despliegue real: publicar imágenes en el registro elegido, cargar variables y CA en Render, verificar remitente en Resend y dominios/reCAPTCHA, disponer de la primera cuenta administrativa y validar entrega/consumo real del OTP y avisos existentes. No hay nuevos disparadores de alertas para módulos académicos futuros, ni webhooks de entrega ni cola/outbox en esta preparación.
