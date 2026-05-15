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
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=tutorlink
export DB_USER=tutorlink_user
export DB_PASSWORD=change_me

export SECURITY_JWT_SECRET=replace_with_a_secret_at_least_32_chars_long
export SECURITY_JWT_EXP_MINUTES=120

export RECAPTCHA_SITE_KEY=test_site_key
export RECAPTCHA_SECRET_KEY=test_secret_key

export SPRING_MAIL_HOST=smtp.gmail.com
export SPRING_MAIL_PORT=587
export SPRING_MAIL_USERNAME=example@example.com
export SPRING_MAIL_PASSWORD=change_me
export SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true
export SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true

export EMAIL_FROM="TutorLink <example@example.com>"
export FRONTEND_BASE_URL=http://localhost:5173
export PORT=8080
export LOG_LEVEL=INFO

export APP_OTP_EXP_MINUTES=5
export APP_OTP_MAX_ATTEMPTS=5
export APP_OTP_RESEND_COOLDOWN_SECONDS=60
```

Consulta [`.env.example`](./.env.example) para una referencia segura.

## Ejecucion local

Levantar la aplicacion:

```bash
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
- Usa valores de ejemplo en archivos versionados y secretos reales solo en el entorno local o en secretos del proveedor de despliegue.
