# Navegación propuesta por roles — TutorLink

> Actualización 13/10/2026 — `WorkspaceLayout` es el shell de ADMIN, ESTUDIANTE, TUTOR, DOCENTE y plataforma: navegación por rol, identidad/contexto y cierre de sesión están en el sidebar. DOCENTE y TUTOR continúan separados. Los menús académicos y CRUD SaaS sin ruta funcional siguen fuera de navegación.

Estado: propuesta, no rutas nuevas implementadas. Rutas vigentes: [AUDITORIA_UX.md](AUDITORIA_UX.md); API: [CONTRATO_API_CURSOS.md](../CONTRATO_API_CURSOS.md). Los permisos se verifican en el servidor. Un menú o selector no otorga permisos.

## Modelo de contexto

La identidad pertenece a la cuenta global; institución, membresías y perfiles son independientes. En una futura adaptación AuthContext conservará el `JwtResponse` completo: token, role legado, institutionId, roles, email y name. El nombre institucional se obtiene de opciones autorizadas, no se inventa del correo. `selectedRole` es una preferencia de navegación dentro de `roles` vigentes; no cambia membresías ni sustituye un JWT. Para adjuntos se traduce al actingRole obligatorio.

La institución activa y el rol de trabajo figuran en header desktop/móvil. Mostrar nombres completos, con alternativa textual y estado de carga cuando falta catálogo. No usar un rol global único para elegir todos los permisos. DOCENTE + TUTOR tiene dos espacios independientes y un selector; no requiere dos cuentas.

## Acceso y cambio de contexto

1. Login actual conserva contraseña y reCAPTCHA. Guardar `institutions` del desafío OTP solo en estado temporal; no presentar escuelas antes de validar credenciales.
2. Si hay una institución activa, indicarla. Si hay varias, elegir una antes de enviar OTP y añadir institutionId a verify-otp. No verificar primero para seleccionar después: el OTP es de un solo uso y esa omisión puede consumirlo sin emitir JWT. Sin instituciones disponibles, explicar falta de acceso, sin inventar permisos.
3. Tras respuesta correcta, guardar token/institutionId/roles juntos y obtener opciones vigentes. Un rol → inicio correspondiente; varios → selector de rol o última preferencia que aún pertenezca al contexto. Validar next como ruta interna permitida; no navegar arbitrariamente al valor del query.
4. Para cambiar escuela, GET `/api/auth/institutions` y POST `/api/auth/context` con el ID autorizado. Presentar progreso, impedir escrituras durante transición y actualizar contexto solo con respuesta correcta. Confirmar salida si hay cambios sin guardar.
5. Invalidar datos del contexto anterior, cancelar lecturas pendientes o ignorar respuestas con otra versión de contexto, cerrar dialogs y reconsultar datos. No mostrar un listado de escuela A bajo header B. Claves de estado/caché futuras incluyen institución y, si aplica, rol/recurso; no hace falta instalar caché externa.
6. Si falla cambio, conservar contexto anterior y mostrar error; si la membresía deja de estar vigente, reconsultar opciones y ofrecer una autorizada. No interpretar todo 403 como expiración: rutas heredadas también usan 403 sin autenticación; adjuntos usa 401 específico.
7. Logout descarta sesión y datos cargados; una nueva sesión no restaura contenido de otra cuenta. No introducir refresh tokens o alterar política de almacenamiento en esta fase.

La aceptación de invitación es otro flujo: ruta propuesta `/accept-institution-invitation?token=...`, misma URL que produce EmailService. Se envía a POST `/api/institution-invitations/accept` y no emite JWT. Cuenta existente: sesión de propietario o contraseña cuando corresponda; nueva: datos y contraseña de aceptación. No registrar token en analítica/console, limpiar URL después de lectura controlada y nunca mostrarlo en administración. Mantener `/first-login` para enlaces heredados.

## Árbol de navegación propuesto

Los destinos siguientes son rutas React propuestas; las `/api/...` son recursos reales. Conservar las rutas heredadas cuando la función siga siendo la misma. Todos los detalles muestran curso/grupo y breadcrumbs, respetando ámbito activo.

| Perfil / ámbito | Menú y destinos React propuestos | API real y límites |
| --- | --- | --- |
| SUPER_ADMIN global | `/platform/institutions`; detalle `/platform/institutions/:id`; membresías y administradores dentro del detalle | `/api/platform/institutions` y `/{id}/memberships`, `/{id}/admins`; sin datos privados académicos ni nuevos endpoints globales de cuenta |
| SUPER_ADMIN institucional | Contexto de escuela → gestión institucional y metadatos de adjuntos | JWT con SUPER_ADMIN y institutionId; selección académica requiere además membresía y relaciones del rol |
| ADMIN institucional | `/admin`: Inicio; `/admin/users`: personas/roles; `/admin/students`, `/admin/teachers` nuevo, `/admin/tutors`: vistas filtradas; `/admin/invitations` nuevo; `/admin/assignments`: tutoría; `/admin/periods`, `/admin/courses`, `/admin/groups`: nuevos | `/api/admin/institution/**`, `/api/admin/academic/**`, asignaciones heredadas `/api/admin/users/tutor-students/**`; no administración global |
| DOCENTE | `/teacher/courses`: Mis materias; `/teacher/courses/:groupId`: contenido/clases, tareas, entregas y asistencia; `/teacher/questions`: Consultas de materia | `/api/teacher/**`; solo grupos asignados, autoría para materiales y referencias; no lista de tutorados por rol docente |
| TUTOR académico | `/tutor`: Inicio; `/tutor/pending`: Tutorías pendientes; `/tutor/history`: Historial; `/tutor/profile`: información/cambio de contraseña existente | `/api/tutor/**` y conversación heredada `/api/questions/{id}/messages`; no asistencia o entregas de grupos por rol tutor |
| ESTUDIANTE | `/student`: Inicio; `/student/courses` nuevo: Mis materias; `/student/courses/:groupId`: Materiales/Tareas; `/student/tasks/:taskId` nuevo: Entrega propia; `/student/attendance` nuevo; `/student/course-questions` nuevo: Consultas de materia; `/student/ask`, `/student/questions`: Tutoría académica; `/student/info`: información | `/api/student/**`; inscripción y propiedad verificadas; nunca entregas de compañeros |

“Mis tutorados” como listado dedicado es **futuro**: los endpoints de tutor disponibles exponen consultas/actividad/perfil, no un directorio paginado de todos sus estudiantes. Mostrar tutorados que aparecen en consultas no equivale a esa lista. Perfil familiar queda **reservado**, sin menú ni ruta hasta soporte completo. No incluir calificaciones, pagos, WhatsApp, almacenamiento privado o indicadores globales inexistentes.

## Separación funcional y acciones

| Recurso | Docente | Tutor | Estudiante | ADMIN / SUPER_ADMIN institucional |
| --- | --- | --- | --- | --- |
| Materias/grupos | Asignados | Sin acceso por este rol | Inscritos | Gestión administrativa expuesta |
| Contenido y tareas | Crear publicados o borradores propios; consultar publicados de colegas asignados | Sin acceso por este rol | Consultar publicados | No asumir contenido privado ni vista de docencia |
| Entregas | Consultar ON_TIME/LATE de inscritos | Sin acceso por este rol | Consultar propias; editar DRAFT dentro de plazo | Desvincular referencia con motivo, no editar entrega académica |
| Asistencia | Crear sesión y registrar/corregir por estudiante | Sin acceso por este rol | Historial propio | No inventar listado/informe administrativo sin endpoint |
| Consulta de materia | Responder; responsable marca principal/cierra | Sin acceso por este rol | Crear/seguimiento propio, no cierre | No asumir bandeja de consultas privadas |
| Tutoría académica | Solo si selecciona además rol TUTOR autorizado | Consultas asignadas y seguimiento heredado | Consultas propias al sistema de tutorías | Asignaciones tutor–estudiante, no docencia implícita |
| Referencias de adjunto | Según autoría/asignación/estado | ActingRole TUTOR no admitido | Propias y material autorizado | Metadatos y desvinculación justificada; no URL por privilegio |

No ofrecer “editar/publicar después”, “reabrir entrega”, “deshacer desvinculación” o “quitar docente del grupo” cuando no existe método REST. Una operación soportada por datos internos no equivale a operación expuesta al frontend.

## Particularidad SUPER_ADMIN

Login sin institutionId emite ámbito global con `roles=[PLATFORM_SUPER_ADMIN]`; la UI lo denomina SUPER_ADMIN de plataforma. Sus opciones de instituciones no se derivan solo de `/api/auth/institutions` (lista membresías): en global usa el listado `/api/platform/institutions`. Entrar a una escuela requiere POST context con institución activa y obtiene roles locales más SUPER_ADMIN.

`ContextRequest.institutionId` es obligatorio: no existe un endpoint actual para volver al ámbito global con null. La propuesta inicial exige cerrar sesión y autenticar otra vez sin institución para regresar a SaaS; no guardar un segundo JWT global escondido ni prometer cambio sin reautenticación. Esto es limitación de contrato a resolver en otra fase si se necesita mejor ergonomía. Las rutas institucionales no otorgan nuevos roles académicos a SUPER_ADMIN; la restricción backend vigente se conserva.

`/admin/admins` redirige a `/admin/users?legacy=admins` y muestra un aviso: la gestión de ADMIN pertenece al panel SaaS. No hay formulario institucional para conceder ADMIN ni SUPER_ADMIN.

## Navegación académica 2B.4

ADMIN dispone de Periodos académicos, Cursos y materias y Grupos. El detalle de grupo muestra docentes asignados e inscripciones con filtros y paginación; permite asignar docentes, inscribir/reactivar estudiantes y retirar estudiantes conservando historial. No se ofrece retiro de docentes porque el backend aún no tiene esa operación.

DOCENTE y ESTUDIANTE disponen de Mis materias en `/teacher/courses` y `/student/courses`, respectivamente. Cada vista usa exclusivamente el listado contextual correspondiente, diferencia carga, error, vacío y filtros sin resultados, y solo expande la información ya cargada. No se habilitan enlaces a módulos posteriores. Al cambiar institución, `axiosClient` descarta respuestas antiguas y las páginas vuelven a solicitar sus catálogos.

## Recorridos de aceptación para la futura implementación

| Caso | Resultado exigido |
| --- | --- |
| Una escuela con DOCENTE/TUTOR | Contexto único, selector de rol, bandejas independientes, ningún cambio de asignaciones |
| Dos escuelas con perfiles distintos | Selección antes de OTP; cambiar escuela cambia nombre/roles/perfil y descarta datos anteriores |
| ADMIN suspende TUTOR local | Cuenta global visible sin cambio; DOCENTE local y escuelas restantes conservan acceso |
| URL docente por rol TUTOR | Mensaje de acceso restringido; no contenido ni bucle de login |
| SUPER_ADMIN global/institucional | SaaS solo en global; escuela explícita para gestión local; no acceso privado administrativo |
| JWT/recurso inválido o membresía revocada | Mensaje uniforme sin confirmar existencia de recurso ajeno; opciones/contexto se revalidan |
| Deep link de invitación | Prueba válida vincula solo después de aceptación; expiración/reuso informa recuperación; no JWT inventado |

La familiaridad de navegación se valida con personas y dispositivos en implementación posterior. No se cambia ninguna guardia o regla durante esta planificación.

## Actualización 2B.3 — administración institucional implementada

ADMIN muestra **Usuarios, Estudiantes, Docentes, Tutores, Invitaciones y Asignaciones**. Estudiantes, docentes y tutores son vistas del mismo listado paginado V30 con un filtro de rol fijo; la ficha permite editar perfiles institucionales y operar sus membresías locales. DOCENTE y TUTOR pueden coexistir para una persona sin sobrescribir perfiles. Asignaciones permanece aislado como módulo de tutorías heredadas.

La navegación no ofrece Administradores: `/admin/admins` conserva compatibilidad mediante redirección con aviso, sin acceso a operaciones de plataforma. Las rutas siguen bajo `AdminRoute`, por lo que un enlace visible no amplía los permisos del JWT contextual.


## Ajuste implementado: perfil y sesión

La identidad y salida se agrupan al pie del sidebar compartido. La selección de institución y espacio se ofrece en Mi perfil, conservando las APIs y guardias. Las rutas docentes y de SUPER_ADMIN disponen de una superficie de perfil limitada a datos de sesión y contexto. El detalle de rutas, navegación móvil y pruebas está en [NAVEGACION_SESION.md](NAVEGACION_SESION.md).
