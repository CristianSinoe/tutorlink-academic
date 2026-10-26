# TutorLink Backend

API REST de TutorLink construida con Spring Boot, PostgreSQL, Flyway y JWT.

## Stack

- Java 17
- Spring Boot 3
- Spring Security
- Spring Data JPA
- Flyway
- PostgreSQL
- Maven

## Requisitos

- Java 17
- Maven 3.9+
- PostgreSQL accesible desde el entorno local

## Variables de entorno

Configura las variables necesarias antes de ejecutar la aplicacion:

```bash
export SPRING_PROFILES_ACTIVE=demo

export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=tutorlink_demo
export DB_USER=change_me
export DB_PASSWORD=change_me

export SECURITY_JWT_SECRET=replace_with_a_secret_at_least_32_chars_long
export SECURITY_JWT_EXP_MINUTES=120

export RECAPTCHA_SITE_KEY=test_site_key
export RECAPTCHA_SECRET_KEY=test_secret_key

export APP_SEED_ADMIN_ENABLED=true
export APP_SEED_ADMIN_EMAIL=admin.demo@example.com
export APP_SEED_ADMIN_NAME="Administrador TutorLink Demo"
export APP_SEED_ADMIN_PASSWORD=change_me

export ADMIN_BOOTSTRAP_ENABLED=true
export ADMIN_BOOTSTRAP_TOKEN=change_me_long_secure_token

export MAIL_HOST=smtp.gmail.com
export MAIL_PORT=587
export MAIL_USERNAME=change_me@gmail.com
export MAIL_PASSWORD=change_me_app_password
export MAIL_FROM=change_me@gmail.com
export MAIL_SMTP_AUTH=true
export MAIL_SMTP_STARTTLS_ENABLE=true

export FRONTEND_BASE_URL=http://localhost:5173
export TUTORLINK_CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,http://127.0.0.1:*,http://192.168.*.*:*,http://10.*.*.*:*
export PORT=8080
export LOG_LEVEL=INFO

export APP_OTP_EXP_MINUTES=5
export APP_OTP_MAX_ATTEMPTS=5
export APP_OTP_RESEND_COOLDOWN_SECONDS=60
```

Consulta [`.env.example`](./.env.example) para una referencia segura del perfil local y demo.

Para pruebas locales persistentes con PostgreSQL y Gmail SMTP usa `backend/.env.local.example` y `docker-compose.local.yml`. Ese perfil es independiente de `prod`/Aiven/Resend; consulta [la guía de SMTP local](../docs/deployment/LOCAL_SMTP_GMAIL.md).

`FRONTEND_BASE_URL` se usa para links generados por el backend. Si vas a acceder desde otros dispositivos de la LAN, ajustalo manualmente a `http://IP_DE_LA_MAQUINA:5173`.

## Perfil demo temporal

Con `SPRING_PROFILES_ACTIVE=demo`, el backend copia los datos de PostgreSQL a H2 en memoria y agrega perfiles y preguntas sintéticos. Todos los cambios de esa sesión se descartan al cerrar. Los correos se muestran en consola. Para usar PostgreSQL de forma persistente, usa `local` o desactiva `demo`. Consulta [la guía demo](DEMO.md).

## Ejecucion local

Levantar la aplicacion:

```bash
source .env.demo
mvn spring-boot:run
```

Compilar el paquete:

```bash
mvn package -DskipTests
```

## Pruebas

Ejecutar pruebas:

```bash
mvn test
```

## Flyway

- Las migraciones viven en `src/main/resources/db/migration/`.
- Flyway es la fuente versionada del esquema.
- Antes de agregar una nueva migracion, confirma que el cambio de esquema sea real y necesario.
- No subas cambios manuales de base de datos fuera de una migracion versionada.
- Riesgo conocido: el proyecto hoy usa Flyway junto con `spring.jpa.hibernate.ddl-auto=update`; cualquier cambio a esa estrategia debe validarse antes de endurecerla.

## Endpoints principales

- `POST /api/auth/login`
- `POST /api/auth/login/verify-otp`
- `POST /api/auth/first-login/complete`
- `GET /api/me`
- `POST /api/student/questions`
- `GET /api/student/questions/my`
- `GET /api/tutor/questions/pending/my`
- `POST /api/tutor/questions/{id}/answer`
- `GET /api/admin/users`
- `POST /api/admin/users/students`
- `POST /api/admin/users/tutors`

## Seguridad

- No subas archivos `.env` reales.
- No subas secretos SMTP, JWT o reCAPTCHA al repositorio.
- Para Gmail usa una contrasena de aplicacion, no la contrasena normal de la cuenta.
- El seed de administrador y el endpoint `/api/internal/bootstrap/admin` son solo para `dev`, `local` y `demo`; no los habilites en produccion.
- Usa valores de ejemplo en archivos versionados y secretos reales solo en el entorno local o en secretos del proveedor de despliegue.
- Los patrones CORS por defecto estan pensados para desarrollo local/LAN; en produccion debes restringirlos por ambiente.
