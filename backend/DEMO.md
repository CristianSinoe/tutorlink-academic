# Demo temporal de TutorLink

El perfil `demo` trabaja con una copia en memoria de los datos existentes y añade datos sintéticos. PostgreSQL se abre únicamente para leer la copia inicial. Las migraciones y las escrituras de la sesión nunca se ejecutan en el origen.

## Arranque

La base PostgreSQL de origen debe existir y tener el esquema actualizado de TutorLink. Usa en `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` la conexión de la base cuyos datos quieres ver. También se admite `SPRING_DATASOURCE_URL`, junto con su usuario y contraseña habituales.

Con las variables habituales del backend ya configuradas:

```bash
cd backend
SPRING_PROFILES_ACTIVE=demo mvn spring-boot:run
```

Si las guardas en `.env.demo`, expórtalas antes de arrancar (el archivo debe tener sintaxis de shell y valores con espacios entre comillas):

```bash
cd backend
set -a
source .env.demo
set +a
SPRING_PROFILES_ACTIVE=demo mvn spring-boot:run
```

Espera el mensaje `DEMO listo` antes de usar el frontend. Si el origen no está disponible o le faltan tablas/columnas requeridas, el arranque falla; no se sustituye silenciosamente por una demo vacía. No es necesario cambiar el frontend.

## Datos incluidos

Además de los registros existentes, cada arranque genera:

- 20 tutores y 300 estudiantes activos.
- 300 asignaciones entre los perfiles sintéticos.
- 300 preguntas repartidas entre los alcances y estados disponibles.
- Respuestas, mensajes y versiones para las preguntas publicadas y corregidas.

Los nombres contienen `Demo`, las matrículas y códigos comienzan por `DEMO-` y los correos terminan en `@example.invalid`. Se usa un sufijo nuevo por arranque para evitar colisiones. Las relaciones sintéticas se crean entre los nuevos perfiles; puedes reasignarlos durante la sesión.

Puedes ajustar las cantidades y la contraseña compartida de los usuarios sintéticos:

```bash
DEMO_TUTORS=20 DEMO_STUDENTS=300 DEMO_PASSWORD='MiClaveDemo123!' \
  SPRING_PROFILES_ACTIVE=demo mvn spring-boot:run
```

Valores predeterminados: 20 tutores, 300 estudiantes y contraseña `TutorLinkDemo2026!`. Límites: 1–100 tutores y 1–2000 estudiantes. Los correos concretos se ven en el panel administrativo.

## Acceso y correos

Los usuarios copiados conservan sus contraseñas y estados. Puedes ingresar con tu administrador habitual. Si necesitas un administrador inicial, la configuración existente `APP_SEED_ADMIN_*` sigue funcionando y lo crea solo en memoria.

En `demo`, todos los correos se simulan: los OTP y enlaces de activación aparecen en la consola del backend. No se conecta a SMTP, aunque haya credenciales de correo configuradas. reCAPTCHA y la autenticación siguen activos.

## Duración y modo normal

Al detener el backend se pierde **toda** la sesión: datos sintéticos, altas, importaciones, cambios de contraseña y modificaciones sobre las copias de registros reales. También desaparece si el proceso termina abruptamente. Al reiniciar se toma una copia nueva del origen. Los cambios que otras instancias hagan en PostgreSQL durante la sesión no se reflejan hasta reiniciar.

Para volver al modo persistente, arranca sin el perfil `demo`, por ejemplo:

```bash
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run
```

Ese modo usa PostgreSQL y el correo habitual. El comportamiento del perfil `demo` cambió: antes usaba una base persistente y SMTP real.

## Alcance técnico

H2 contiene las tablas y columnas mapeadas por las entidades actuales de la aplicación, con sus identificadores y relaciones. Las columnas legacy, tablas sin entidad y el historial de Flyway no se copian. No es una copia de seguridad ni sustituye las pruebas de compatibilidad con PostgreSQL. El volumen copiado debe caber en la memoria disponible del backend.

El cierre del pool elimina la base H2, sin archivos de base de datos ni tareas de limpieza sobre PostgreSQL. Los logs habituales del backend y cualquier captura externa de la consola pueden conservarse independientemente de la base temporal.
