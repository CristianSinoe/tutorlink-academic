# Desarrollo local con PostgreSQL y Gmail SMTP

La ejecución local está aislada de producción. Usa el perfil Spring `local`, PostgreSQL en el proyecto Compose `tutorlink-local` y la base `tutorlink_local` en `127.0.0.1:55432`. Render continúa usando `prod`, Aiven y Resend; nunca se debe reutilizar este archivo para Render.

## Preparación

1. Crea una cuenta Gmail exclusiva para desarrollo y habilita la verificación en dos pasos.
2. Genera una contraseña de aplicación de Gmail. No uses la contraseña normal de la cuenta ni la pegues en Git.
3. Copia la plantilla y completa sus valores privados:

```sh
cp backend/.env.local.example backend/.env.local
chmod 600 backend/.env.local
```

Configura `MAIL_USERNAME`, `MAIL_PASSWORD` y `MAIL_FROM` con la cuenta de desarrollo. `MAIL_FROM` debe pertenecer a esa cuenta. El archivo está ignorado por Git.

## Arranque

Desde la raíz:

```sh
scripts/local/run-gmail.sh
```

El script rechaza perfiles `prod`, Resend, Aiven, bases distintas de `tutorlink_local` y puertos distintos de `55432`. Flyway aplica las migraciones disponibles y `DemoDataSeeder` crea datos sintéticos idempotentes, incluidos administradores institucionales de demostración. El `APP_SEED_ADMIN_*` heredado permanece desactivado porque crea una cuenta global sin membresía institucional.

La aplicación queda en `http://localhost:5173` y la API en `http://localhost:8080`. Los OTP, invitaciones y avisos se envían por Gmail SMTP. El contenido de los correos no se escribe en logs del backend.

Para detener el entorno:

```sh
docker compose -f docker-compose.local.yml down
```

Para conservar la base local, no uses `-v`. Para empezar desde cero solo la base local, usa `docker compose -f docker-compose.local.yml down -v`; esto no afecta Aiven ni los datos de Render.

## Pruebas sin Gmail

Las pruebas unitarias, H2 y E2E efímeras existentes siguen usando sus propios perfiles y transportes controlados. No deben apuntar a `backend/.env.local`. La ejecución E2E mantiene su PostgreSQL `tutorlink_e2e` en el puerto `55433`.

## Producción

En Render conserva `SPRING_PROFILES_ACTIVE=prod`, `tutorlink.mail.provider=resend`, la clave de Resend, el certificado CA de Aiven y el origen HTTPS del frontend. No copies `backend/.env.local`, `MAIL_PASSWORD`, `SECURITY_JWT_SECRET` ni claves de reCAPTCHA de prueba a Render.
