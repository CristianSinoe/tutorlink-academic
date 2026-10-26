# Estrategia futura de rutas institucionales

Estado: backend implementado en V31; el enrutado React queda para la siguiente fase.

El backend usa el código institucional como slug único y estable, normalizado a mayúsculas y validado con `[A-Za-z0-9-]`. `GET /api/public/institutions/{code}` devuelve únicamente código y nombre de una institución activa. No crea una sesión, no selecciona una institución activa y no otorga permisos.

`POST /api/auth/login` y `POST /api/auth/login/verify-otp` aceptan opcionalmente `institutionCode`. Cuando se usa, el desafío OTP queda vinculado a esa institución en V31 y el servidor rechaza cualquier cambio de institución durante la verificación. El enlace puede ser `/benitojuarez/login` si el código institucional es `BENITOJUAREZ`, o `/DEMO15-I1/login` para la demo.

Tras autenticación, el JWT contextual sigue siendo la fuente de institución y roles. Si un slug de la URL no coincide con el contexto autorizado, la interfaz mostrará una recuperación para seleccionar una institución autorizada; nunca realizará `POST /api/auth/context` solo por el valor del slug. Las rutas actuales (`/admin`, `/student`, `/tutor`, `/teacher`, `/platform`) permanecerán durante una transición con redirecciones explícitas y compatibilidad de enlaces.

El frontend todavía debe consumir este contrato y resolver las rutas `/{code}/login` y `/{code}/otp`. La autorización continúa dependiendo del JWT contextual y de la membresía; un código manual nunca sustituye la autorización ni permite escalar roles.
