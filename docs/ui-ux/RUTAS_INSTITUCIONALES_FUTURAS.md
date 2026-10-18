# Estrategia futura de rutas institucionales

Estado: diseño documentado; no se implementa una ruta por slug en esta fase.

Las instituciones podrán tener un `slug` único y estable, con validación de formato y reserva de `platform`, `login` y `api`. Una ruta futura como `/{slug}/login` podrá cargar únicamente branding público validado. No creará una sesión, no seleccionará una institución activa y no otorgará permisos.

Tras autenticación, el JWT contextual sigue siendo la fuente de institución y roles. Si un slug de la URL no coincide con el contexto autorizado, la interfaz mostrará una recuperación para seleccionar una institución autorizada; nunca realizará `POST /api/auth/context` solo por el valor del slug. Las rutas actuales (`/admin`, `/student`, `/tutor`, `/teacher`, `/platform`) permanecerán durante una transición con redirecciones explícitas y compatibilidad de enlaces.

Antes de implementarlo se requiere un contrato backend que exponga slugs públicos seguros y un mapeo contextual verificable. El cambio debe incluir pruebas de reserva de rutas globales, slugs inválidos, desajuste slug/JWT y redirecciones, sin usar IDs manuales como sustituto de la autorización.
