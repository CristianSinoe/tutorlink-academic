# Contrato API: cursos y multiinstitución

> UI 2B.2: el frontend no consume aún un endpoint de branding. El futuro contrato de marca contextual y ruta pública propuesta se documentan en [PERSONALIZACION_INSTITUCIONAL.md](ui-ux/PERSONALIZACION_INSTITUCIONAL.md); no forman parte de esta API ni otorgan contexto o permisos.

## Consumo frontend — fase 2B.1

React consume ahora el JwtResponse completo (`token`, `role` legado, `institutionId`, `roles`, `email`, `name`). La sesión local versionada conserva un rol visual autorizado sin cambiar permisos ni el JWT. OTP recibe las opciones del desafío y envía institutionId cuando corresponde antes de consumir el código. Cambiar escuela utiliza únicamente GET `/api/auth/institutions` y POST `/api/auth/context`, bloquea escrituras durante transición y descarta respuestas del contexto anterior.

Rutas React añadidas: `/context`, `/teacher` (bienvenida/contexto), `/platform` (listado y entrada institucional, sin CRUD SaaS), `/accept-institution-invitation` y `/access-denied`. Las rutas heredadas permanecen. SUPER_ADMIN global se autentica por `/login?access=platform` y consulta `/api/platform/institutions`; regresar al ámbito global desde una escuela exige reautenticación, sin POST de institución nula.

Aceptar una invitación consume el DTO existente, limpia la prueba de la URL y no inicia sesión automáticamente. Su resultado UserResponse no es JwtResponse. Los rechazos de prueba vencida/cancelada/utilizada/cuenta no autorizada siguen siendo uniformes; no se introduce inspección pública de invitaciones ni nuevos endpoints backend. Implementación, pruebas simuladas y límites de integración real: [AUTENTICACION_CONTEXTO.md](ui-ux/AUTENTICACION_CONTEXTO.md).

## Contexto y autorización

Cada JWT emitido después de iniciar sesión incluye `uid`, `authVersion`, `institutionId` y los roles activos. La API consulta en cada petición el usuario, la versión de autorización, la institución y las membresías: revocar una membresía retira sus permisos en la institución seleccionada sin invalidar los contextos válidos de otras instituciones. `POST /api/auth/context` recibe `{ "institutionId": 1 }` y emite un JWT para esa institución.

`SUPER_ADMIN` es global. Un token global sin `institutionId` solo puede usar `/api/platform/**`; para operar un recurso institucional debe seleccionar una institución. `ADMIN`, `ESTUDIANTE`, `TUTOR` y `DOCENTE` proceden de membresías institucionales. Un usuario puede tener más de una membresía y ser docente y tutor sin que una relación implique la otra.

El registro público no está permitido. Los perfiles se crean mediante administración institucional, conservando activación, OTP y recuperación de contraseña.

## Rutas implementadas

| Ruta | Permiso | Operación |
| --- | --- | --- |
| `POST /api/auth/context` | autenticado | Selecciona institución y emite JWT contextual. |
| `GET /api/platform/institutions` | SUPER_ADMIN global | Lista instituciones, sin datos sensibles. |
| `POST /api/platform/institutions` | SUPER_ADMIN global | Crea institución. |
| `PUT /api/platform/institutions/{id}` | SUPER_ADMIN global | Actualiza código, nombre y zona horaria. |
| `PATCH /api/platform/institutions/{id}/status` | SUPER_ADMIN global | Activa o desactiva institución. |
| `GET /api/platform/institutions/{id}/memberships` | SUPER_ADMIN global | Lista membresías con datos públicos del usuario. |
| `POST /api/platform/institutions/{id}/admins` | SUPER_ADMIN global | Concede membresía ADMIN a un usuario existente. |
| `DELETE /api/platform/institutions/{id}/admins/{userId}` | SUPER_ADMIN global | Revoca una membresía ADMIN. |
| `POST /api/admin/academic/periods` | ADMIN | Crea periodo académico. |
| `GET /api/admin/institution/users` | ADMIN | Lista paginada y filtrada de usuarios de la institución activa. |
| `POST /api/admin/institution/users` | ADMIN | 202: emite una invitación; no vincula cuentas por coincidencia de correo ni asigna perfiles antes de aceptación. |
| `POST /api/admin/institution/users/{id}/roles` | ADMIN | Agrega ESTUDIANTE, TUTOR o DOCENTE sin alterar el rol legado. |
| `DELETE /api/admin/institution/users/{id}/roles/{role}` | ADMIN | Revoca una membresía institucional autorizada. |
| `PATCH /api/admin/institution/users/{id}/status` | ADMIN | Activa, suspende o revoca únicamente membresías académicas de la institución; no modifica tl_users.status. |
| `POST /api/admin/academic/courses` | ADMIN | Crea curso institucional. |
| `POST /api/admin/academic/groups` | ADMIN | Crea grupo para curso y periodo. |
| `POST /api/admin/academic/groups/{id}/teachers` | ADMIN | Asigna docente al grupo. |
| `POST /api/admin/academic/groups/{id}/enrollments` | ADMIN | Inscribe estudiante. |
| `DELETE /api/admin/academic/groups/{id}/enrollments/{studentId}` | ADMIN | Retira inscripción sin borrar historial. |
| `GET /api/teacher/courses` | DOCENTE | Lista grupos asignados al docente actual. |
| `POST /api/teacher/contents` | DOCENTE | Publica o prepara contenido. |
| `POST /api/teacher/tasks` | DOCENTE | Crea tarea del grupo asignado. |
| `POST /api/teacher/sessions` | DOCENTE | Registra una sesión para uno de sus grupos. |
| `PUT /api/teacher/sessions/{id}/attendance` | DOCENTE | Registra o corrige la asistencia de un estudiante inscrito. |
| `POST /api/teacher/questions/{id}/messages` | DOCENTE | Responde una consulta de materia; el responsable puede cerrar o marcar respuesta principal. |
| `GET /api/student/courses` | ESTUDIANTE | Lista grupos con inscripción activa. |
| `GET /api/student/progress` | ESTUDIANTE | Resumen de tareas y asistencia por grupo. |
| `GET /api/student/attendance` | ESTUDIANTE | Consulta únicamente su historial de asistencia. |
| `POST /api/student/course-questions` | ESTUDIANTE | Crea consulta de materia para un grupo inscrito. |
| `GET /api/student/course-questions` | ESTUDIANTE | Lista únicamente sus consultas de materia. |
| `GET /api/student/course-questions/{id}/messages` | ESTUDIANTE | Consulta mensajes de una consulta propia. |
| `PUT /api/student/tasks/{id}/submission` | ESTUDIANTE | Guarda borrador o entrega final. |

Las listas respetan siempre la institución del token. Los identificadores enviados desde otra institución se rechazan con `400` o `403`; relaciones duplicadas devuelven `409`.

Las rutas `/api/platform/**` requieren un JWT global de `SUPER_ADMIN`, sin institución seleccionada. Un `SUPER_ADMIN` que opera recursos institucionales debe emitir primero un contexto con `POST /api/auth/context`.

`tl_users.role` se conserva para compatibilidad de tutorías heredadas. Las membresías activas son la fuente de permisos institucionales; agregar o revocar DOCENTE/TUTOR/ESTUDIANTE no altera el rol legado ni permite asignar `SUPER_ADMIN`.

## DTO principales

```json
POST /api/admin/academic/groups
{ "courseId": 10, "periodId": 3, "code": "A", "name": "Grupo A" }

POST /api/teacher/tasks
{ "groupId": 21, "title": "Ejercicios", "instructions": "Resuelve 1-5", "dueAt": "2026-10-20T23:59:00-06:00", "published": true, "allowLateSubmissions": false }

PUT /api/student/tasks/50/submission
{ "body": "Enlace o texto de la entrega", "finalSubmission": true }

POST /api/student/course-questions
{ "groupId": 21, "targetTeacherId": 7, "subject": "Duda sobre la tarea", "body": "¿La entrega requiere portada?" }

PUT /api/teacher/sessions/31/attendance
{ "studentId": 48, "status": "PRESENT" }
```

Las entregas son únicas por tarea y estudiante. Un borrador usa estado `DRAFT`; una entrega final usa `ON_TIME` o `LATE`. La entrega posterior a `dueAt` se rechaza si `allowLateSubmissions` es falso. El estado y la hora de una entrega existente no se recalculan si la tarea cambia después.

## Modelo y reglas pendientes de exponer

La migración `V27` incorpora perfiles `Teacher`, periodos, cursos, grupos, asignaciones Docente-Grupo, inscripciones, contenidos, tareas, sesiones, asistencia, adjuntos y consultas de materia. Los adjuntos contienen solo metadatos y URL (`title`, `fileName`, `url`, `mimeType`, `sizeBytes`, `publicId`, institución y cargador); no se almacena binario ni se integra Cloudinary aún.

Las consultas de materia están separadas de `Question`/`Answer` de tutoría. Pertenecen a un grupo, permiten docente destino opcional y un responsable que cierra la consulta; los docentes restantes pueden intervenir. Las rutas de conversación, asistencia y referencias de adjuntos están expuestas. La importación CSV/XLSX institucional está implementada en la fase 1.5. Otros módulos pendientes quedan fuera del alcance.

## Referencias de adjuntos — fase 1.4.3

Las clases se referencian mediante `CONTENT` (`tl_course_contents`), no mediante sesiones. Todas las rutas requieren JWT institucional y el parámetro obligatorio `actingRole` (`DOCENTE`, `ESTUDIANTE`, `ADMIN`, `SUPER_ADMIN`). La elección del rol no concede autoridad: `AttachmentAuthorizationService` verifica membresía, asignación/inscripción, autoría/propiedad, publicación, estado y plazo según corresponda.

| Ruta | DTO / resultado | Permiso |
| --- | --- | --- |
| `POST /api/attachments?actingRole=DOCENTE` | `Create` → 201, `Location`, `Metadata` | Autor docente asignado, o propietario estudiantil de entrega DRAFT con plazo permitido |
| `GET /api/attachments/{id}?actingRole=ADMIN` | 200, `Metadata` | Consulta autorizada académica o administrativa |
| `GET /api/attachments?resourceType=CONTENT&resourceId=30&actingRole=ESTUDIANTE&page=0&size=20` | 200, lista de `Metadata` | Consulta del padre y cada referencia |
| `GET /api/attachments/{id}/content-reference?actingRole=DOCENTE` | 200, `{id,url}` | `VIEW_CONTENT_REFERENCE` académico y catálogo vigente |
| `POST /api/attachments/{id}/unlink?actingRole=ADMIN` | `Unlink` → 204 | Gestión académica autorizada o desvinculación administrativa justificada |

```json
POST /api/attachments?actingRole=DOCENTE
{
  "resourceType": "CONTENT",
  "resourceId": 30,
  "title": "Guía pública",
  "fileName": "guia.pdf",
  "url": "https://materiales.example.edu/guia.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 1024
}

POST /api/attachments/50/unlink?actingRole=ADMIN
{ "reason": "Referencia publicada por error; retiro administrativo" }
```

El registro **no sube archivos**. Solo admite URLs públicas HTTPS exactamente aprobadas en `tutorlink.attachments.approved-references` para la institución activa. URL/nombre son obligatorios; MIME/tamaño opcionales se completan desde el catálogo, y cualquier valor proporcionado debe coincidir. El título admite hasta 200 caracteres. `publicId` debe omitirse o ser null. El catálogo está vacío por defecto y no se administra por REST.

`Metadata` contiene `id`, `resourceType`, `resourceId`, `title`, `fileName`, `mimeType`, `sizeBytes` y `createdAt`; no contiene URL ni datos del proveedor. Registro, detalle y listado usan siempre esta proyección. Los listados solo incluyen referencias activas, con orden ascendente por id, página desde cero y tamaño de 1–100 (20 por defecto). Un listado vacío exige permiso sobre el padre.

La consulta de contenido devuelve solo una URL pública del catálogo, previa autorización académica. ADMIN/SUPER_ADMIN actuando administrativamente no pueden usarla. Referencias antiguas no verificadas, con metadatos distintos o `public_id`, conservan metadatos y desvinculación, pero no exponen URL. No hay descarga, redirección, consulta externa, URLs firmadas ni almacenamiento privado en esta fase.

Los estudiantes solo gestionan referencias propias en DRAFT y con tarea publicada: hasta `dueAt` inclusive, o después si `allowLateSubmissions=true`. Las entregas ON_TIME/LATE son de consulta; el docente asignado puede revisarlas sin modificarlas. La excepción es la desvinculación administrativa con motivo no vacío, máximo 500 caracteres y auditoría. SUPER_ADMIN requiere institución explícita; una selección académica también exige membresía vigente previamente autorizada.

La desvinculación conserva el registro, actor, fecha y motivo en V29. El historial deja de aparecer en consultas activas y no se eliminan archivos externos. Los cambios y sus eventos de éxito se guardan atómicamente; los rechazos identificables se auditan después del rollback, sin URLs ni detalles internos.

Errores `{message}`: 400 entradas inválidas o referencia no aprobada para registrar; 401 autenticación ausente/inválida; 403 recursos inexistentes, ajenos, desvinculados o no autorizados, con mensaje uniforme; 409 referencia no verificada para consulta o conflicto concurrente; 500 error interno sanitizado. No hay endpoint de edición/reemplazo, carga ni acceso al historial.

Las consultas académicas usan `/api/student/course-questions` y `/api/student/course-questions/{id}/messages`. `/api/student/questions` se conserva para tutorías heredadas: compartir ese mapping impedía arrancar Spring MVC. No se cambian las rutas ni el frontend de tutoría.

El contrato completo del catálogo y la auditoría está en [AUTORIZACION_ADJUNTOS.md](AUTORIZACION_ADJUNTOS.md).

## Cierre institucional y académico — fase 1.5

### Cuenta global, perfiles y membresías

V30 conserva las filas e IDs de `tl_users`, perfiles, asignaciones, inscripciones, preguntas y respuestas heredadas. Elimina únicamente la unicidad global de `user_id` en perfiles y añade unicidad `(institution_id,user_id)` para ESTUDIANTE, TUTOR y DOCENTE. Un mismo usuario puede tener perfiles distintos por escuela y ser DOCENTE y TUTOR simultáneamente. Matrículas/códigos se resuelven siempre en el contexto activo; un trabajo interno sin contexto no puede elegir arbitrariamente entre varios perfiles.

`tl_users` conserva identidad, correo principal, contraseña, estado y versión global. Un ADMIN institucional no edita identidad/correo/contraseña ni desactiva la cuenta global. Gestiona solo perfiles y membresías de su institución. Las membresías admiten `ACTIVE`, `SUSPENDED` y `REVOKED`, y contienen `contact_email` y `contact_verified_at`; el contacto institucional se verifica por invitación, sin cambiar el correo principal. Se aceptan correos personales e institucionales, sin exigir dominio propio.

`status` en `UserResponse`/`UserDetail` es el estado **global de solo lectura**. Los estados editables se obtienen de `UserDetail.memberships`. Las operaciones institucionales no incrementan la versión global: Spring Security sigue consultando las membresías vigentes en cada petición, y los contextos autorizados de otras escuelas continúan funcionando. ADMIN se administra desde las rutas SaaS existentes; las rutas institucionales e invitaciones solo asignan ESTUDIANTE, DOCENTE y TUTOR. SUPER_ADMIN no se asigna mediante estas operaciones.

### Administración institucional

Todas las rutas siguientes requieren ADMIN o SUPER_ADMIN con institución explícita. No aceptan una institución independiente enviada por el cliente.

| Método / ruta | Entrada / resultado |
| --- | --- |
| `GET /api/admin/institution/users` | `q`, `role`, `membershipStatus=ACTIVE|SUSPENDED|REVOKED|ALL`, `status` global de filtro, `page`, `size`; `PageResponse` |
| `GET /api/admin/institution/users/{userId}` | `UserDetail`: identidad de solo lectura, perfiles y membresías locales, incluidos roles revocados |
| `PUT /api/admin/institution/users/{userId}/profiles/{role}` | `ProfileUpdate` completo del perfil institucional; devuelve `UserDetail` |
| `POST /api/admin/institution/users/{userId}/roles` | `RoleRequest`; añade o reactiva un rol académico para un usuario ya vinculado a esa institución |
| `PATCH /api/admin/institution/users/{userId}/roles/{role}/status` | `{status:"ACTIVE"|"SUSPENDED"|"REVOKED"}`; estado independiente por rol |
| `DELETE /api/admin/institution/users/{userId}/roles/{role}` | Revocación lógica, 204; conserva el perfil y el historial |
| `PATCH /api/admin/institution/users/{userId}/status` | Compatibilidad: aplica estado a las membresías académicas locales; `DISABLED` equivale a `SUSPENDED`; nunca desactiva la cuenta global |
| `POST /api/admin/institution/users/invitations` | `InvitationRequest`; 202, `InvitationView`, sin token |
| `GET /api/admin/institution/users/invitations` | `page`, `size`; página de invitaciones locales sin hashes ni tokens |
| `POST /api/admin/institution/users/invitations/{id}/resend` | Reemite prueba de 72 horas; invalida el token anterior; devuelve metadatos |
| `DELETE /api/admin/institution/users/invitations/{id}` | Cancela una invitación pendiente, conserva historial, 204 |
| `POST /api/admin/institution/users/import-csv?role=ESTUDIANTE` | `{csv:"..."}`; `ImportReport`; también admite DOCENTE y TUTOR |
| `POST /api/admin/institution/users/import-excel?role=DOCENTE` | Multipart `file`, `.xlsx`; reutiliza `ExcelImportService`; admite los tres roles académicos |

`POST /api/admin/institution/users` se conserva como adaptador del DTO `UserRequest`: ahora devuelve 202 e invitación, no una cuenta con permisos inmediatos. Sus campos de identidad y contraseña no cambian cuentas existentes. Se recomienda el DTO explícito de invitación para nuevas integraciones.

Los perfiles exponen `id`, `role`, `code`, `department`, `specialty`, `career`, `plan`, `semester`, `phone`; los campos no aplicables son null. `PUT` exige `code` (hasta 50 caracteres); reemplaza los campos opcionales del perfil local. La identidad personal no forma parte de esa actualización. Agregar un rol con perfil ya existente conserva su información; para editarla se usa el PUT específico.

```json
GET /api/admin/institution/users?role=DOCENTE&membershipStatus=ALL&page=0&size=20
{
  "items": [{"userId": 15, "email": "persona@gmail.com", "name": "Persona", "status": "ACTIVE", "roles": ["DOCENTE", "TUTOR"], "profiles": {"DOCENTE": 4, "TUTOR": 9}}],
  "total": 1, "page": 0, "size": 20
}

PUT /api/admin/institution/users/15/profiles/DOCENTE
{"code":"D-100","department":"Sistemas","specialty":"Programación","phone":"5551234567"}

PATCH /api/admin/institution/users/15/roles/TUTOR/status
{"status":"SUSPENDED"}

POST /api/admin/institution/users/invitations
{"contactEmail":"persona@escuela.example.edu","role":"ESTUDIANTE","profile":{"code":"S-100","career":"ISC","plan":"2026","semester":2}}
```

### Consumo React — administración institucional 2B.3

El frontend consume exclusivamente el ámbito resuelto por el JWT contextual. No incluye `institutionId` en ninguna petición de este módulo y descarta lecturas de la generación anterior cuando cambia el contexto. El adaptador `frontend/src/api/institutionAdminApi.js` valida la forma paginada antes de publicar resultados a las vistas.

| Ruta React | Operaciones V30 | Alcance visible |
| --- | --- | --- |
| `/admin/users` | `GET /users`, `GET /users/{id}`, perfil/roles/estado | Personas y membresías de la institución activa; identidad global solo lectura |
| `/admin/students` | Igual, filtro fijo `role=ESTUDIANTE` | Perfiles e importación de estudiantes |
| `/admin/teachers` | Igual, filtro fijo `role=DOCENTE` | Perfiles e importación de docentes |
| `/admin/tutors` | Igual, filtro fijo `role=TUTOR` | Perfiles e importación de tutores |
| `/admin/invitations` | Crear, listar, reenviar y cancelar invitaciones | Contacto, rol, vencimiento y estado; nunca prueba de aceptación |
| `/admin/assignments` | Rutas heredadas de tutoría | Módulo separado de asignaciones tutor–estudiante |

Los filtros de listado son `q`, `role`, `membershipStatus`, `status`, `page` y `size=20`. La UI interpreta `status` como estado global de consulta y edita únicamente `memberships[].status`. Suspender, reactivar y revocar requieren confirmación y conservan los campos de edición cuando el servidor devuelve 400, 403 o 409. `POST /users/invitations` es el único alta nueva de la interfaz y no acepta contraseñas ni promete una entrega de correo.

Para importaciones, CSV se transforma localmente en `{csv}` y se envía a `POST /users/import-csv?role=…`; XLSX se envía como `FormData` a `POST /users/import-excel?role=…`, dejando el boundary a Axios. El reporte muestra los contadores y filas retornados (`created`, `invited`, `skipped`, `failed`), sin inferir resultados no devueltos por la API.

### Aceptación verificada y acceso contextual

`POST /api/institution-invitations/accept` admite `{token}` con un JWT válido del usuario que vinculará su cuenta. El token se recibe solo por correo, nunca en respuestas administrativas ni auditoría. Una invitación a un correo principal ya registrado o a un código de perfil existente se vincula al ID de esa cuenta: otra cuenta autenticada no puede apropiársela. Sin coincidencia previa, la prueba de control del contacto puede vincularse a la cuenta global autenticada elegida por su propietario.

Para una persona nueva sin cuenta, la aceptación permite `{token,name,lastNamePaterno,lastNameMaterno,password}`; la prueba verifica el correo invitado, que será su principal. Para una cuenta existente sin sesión, se requiere prueba dirigida a su correo principal y su contraseña correcta. Una cuenta bloqueada/deshabilitada no se reactiva mediante invitación. Si ya se tiene cuenta con otro correo principal, debe iniciarse sesión para vincular el contacto institucional sin crear otra cuenta.

Las pruebas son aleatorias de 256 bits, se guarda solo SHA-256, caducan en 72 horas y son de un solo uso. La aceptación bloquea la invitación y guarda perfil, membresía, contacto verificado, aceptación y auditoría en una transacción. No cambia la identidad global de una cuenta existente. Cancelación, expiración y reenvío invalidan la prueba correspondiente. La aceptación no emite JWT: se utiliza el inicio de sesión/contexto existente después de vincularse.

El correo se envía después del commit, usando el servicio de correo existente y una URL del frontend configurada en el servidor (`/accept-institution-invitation?token=...`). La pantalla de aceptación no se implementa en esta fase. Si falla SMTP, la invitación puede permanecer pendiente aunque la petición devuelva error; se consulta el listado y se reenvía, sin recuperar ni exponer el token anterior. No hay outbox o reintento automático de correo en esta fase.

`POST /api/auth/login` conserva contraseña, reCAPTCHA y OTP. Su respuesta incluye `institutions:[{institutionId,name,roles}]` después de validar credenciales. `POST /api/auth/login/verify-otp` acepta el campo opcional `institutionId`: obligatorio para un usuario normal con varias instituciones; si hay una sola institución activa se selecciona automáticamente aunque tenga varios roles. Una selección ausente/errónea no concede JWT; el OTP sigue siendo de un solo uso.

`GET /api/auth/institutions` devuelve las opciones vigentes de la cuenta autenticada; `POST /api/auth/context` sigue emitiendo un JWT contextual autorizado. `roles` es la lista contextual que debe consumir React; `role` se conserva como clasificación global heredada y no sustituye permisos. `/api/auth/register` está denegado incluso con sesión, para evitar creación de roles suministrados por el cliente.

### Importaciones

El CSV admite UTF-8/BOM, coma o punto y coma, comillas dobles escapadas, CRLF y saltos de línea dentro de campos citados. Máximo 1 000 registros y 1 000 000 de caracteres; páginas y archivos no sustituyen controles de institución. Formato recomendado con cabecera:

```csv
name,lastNamePaterno,lastNameMaterno,email,code,career,plan,semester,phone
Persona,Demo,,personal@gmail.com,S-200,ISC,2026,2,5551234567
```

Para docentes/tutores se sustituyen los campos académicos por `department`, `specialty`, `phone`. Se admiten alias heredados como `matricula`, `tutorCode`, `teacherCode`, `nombre`, `apellidoPaterno`, `carrera`, `semestre` y `telefono`. Sin cabecera se mantienen los órdenes heredados: estudiante `matricula;email;name;lastNamePaterno;lastNameMaterno;career;plan;semester;phone`; tutor/docente `code;email;name;lastNamePaterno;lastNameMaterno;department;specialty;phone`. Los passwords de CSV no se utilizan para cambiar credenciales.

Cada registro válido se procesa en su propia transacción; errores en una fila no revierten otras. Duplicados en el archivo o membresías ya activas se reportan, sin sobrescribir perfiles. Usuarios nuevos o no vinculados quedan **invitados**, sin acceso hasta aceptar. Un usuario ya vinculado y activo puede recibir un rol académico adicional autorizado. Invitaciones pendientes/códigos reservados devuelven conflictos; el reporte no expone contraseñas, tokens ni SQL.

```json
{"total":3,"created":0,"invited":1,"skipped":1,"failed":1,"rows":[
  {"row":2,"outcome":"INVITED","message":"Invitación verificada pendiente","userId":null,"invitationId":45},
  {"row":3,"outcome":"SKIPPED","message":"Duplicado en el archivo","userId":null,"invitationId":null},
  {"row":4,"outcome":"FAILED","message":"Datos de fila inválidos","userId":null,"invitationId":null}
]}
```

`row` cuenta registros lógicos, incluida la cabecera, no líneas físicas dentro de campos citados. `created` cuenta perfiles/membresías adicionales de cuentas ya vinculadas; `invited` cuenta invitaciones emitidas. El listado de invitaciones permite recuperar su estado y reintentar entrega de correo.

### Listados y seguimiento académico para React

Los listados académicos siguientes usan el DTO existente `PagedResponse`: `{content,page,size,totalElements,totalPages}`, con página cero, tamaño 20 por defecto, máximo 100 y orden estable por ID. No usan el sobre `{items,total,...}` de usuarios institucionales.

| Rutas GET | Filtros / permiso |
| --- | --- |
| `/api/admin/academic/periods`, `/courses`, `/groups` | ADMIN/SUPER_ADMIN institucional; `q`; grupos también `courseId`, `periodId` |
| `/api/teacher/courses`, `/api/student/courses` | `q`; solo grupos asignados o inscritos, respectivamente |
| `/api/teacher/contents`, `/tasks`, `/api/student/contents`, `/tasks` | `groupId`, `q`; el estudiante solo ve publicados; docente ve publicados y borradores propios |
| `/api/teacher/groups/{id}/students` | Docente asignado; alumnos inscritos, `student_id`, matrícula y nombre para asistencia |
| `/api/teacher/sessions` | `groupId`; sesiones de grupos asignados |
| `/api/teacher/tasks/{id}/submissions` | Docente asignado; solo entregas ON_TIME/LATE de alumnos inscritos; incluye IDs para adjuntos |
| `/api/student/tasks/{id}/submission` | Propia, sin paginación; entrega y su ID, o `{taskId,status:"PENDING"}` si aún no hay registro |
| `/api/student/progress` | Indicadores propios por grupo inscrito |
| `/api/student/attendance` | `groupId`, `status=PRESENT|ABSENT|LATE|EXCUSED`; registros propios |
| `/api/teacher/questions`, `/api/student/course-questions` | `groupId`, `q`, `status=OPEN|IN_PROGRESS|CLOSED`; docente asignado o estudiante propietario |
| `/api/teacher/questions/{id}`, `/api/student/course-questions/{id}` | Detalle autorizado, sin paginación |
| `/api/teacher/questions/{id}/messages`, `/api/student/course-questions/{id}/messages` | Conversación autorizada y paginada |

Los mapas académicos normalizan nombres SQL en minúsculas con guiones bajos en H2 y PostgreSQL (`group_id`, `author_teacher_id`, `submitted_at`, etc.). Las referencias de adjuntos mantienen sus DTO camelCase. Ejemplo:

```json
GET /api/student/tasks?groupId=21&page=0&size=20
{"content":[{"id":50,"group_id":21,"author_teacher_id":7,"title":"Actividad","published":true,"due_at":"2026-10-20T23:59:00-06:00","allow_late_submissions":false}],"page":0,"size":20,"totalElements":1,"totalPages":1}

GET /api/student/tasks/50/submission
{"id":81,"task_id":50,"body":"Entrega","status":"ON_TIME","submitted_at":"2026-10-20T20:00:00Z"}
```

Para agregar adjuntos a una entrega: guardar primero DRAFT con el PUT existente, consultar su ID con GET y registrar referencias mediante la API de adjuntos. Después de finalizar, ni el cuerpo ni los adjuntos se editan. Guardar borrador y finalizar respetan `dueAt` inclusive y `allowLateSubmissions` después del límite, con reloj UTC del servidor. Una reentrega/reapertura requiere una fase posterior; no se sobrescriben entregas finales ni se recalculan sus estados al cambiar fechas.

`POST /api/student/course-questions/{id}/messages` admite `{body}` y permite seguimiento del propietario inscrito mientras la consulta no esté cerrada. El estudiante no marca respuesta principal ni cierra. El POST docente existente admite `{body,primaryAnswer,close}`: docentes asignados pueden intervenir; el responsable puede marcar la única respuesta principal y cerrar. La primera respuesta asume responsabilidad si no había docente destino; consultas CLOSED no reciben modificaciones. Respuesta, responsabilidad, cierre y auditoría son atómicos.

Las tutorías siguen usando `/api/student/questions` y `/api/tutor/**`, independientes de las materias. `/api/tutor/questions/pending` ahora devuelve DTO de las consultas asignadas al tutor actual; no entidades ni preguntas globales de otros tutores. Los módulos heredados resuelven perfiles/códigos en la institución del JWT. Sus listados administrativos también se filtran por institución; las actualizaciones heredadas no editan identidad global y su cambio de estado afecta membresías locales. Se recomiendan los nuevos endpoints institucionales para gestión de roles y estados independientes.

Las escrituras académicas e institucionales registran actor, institución, tipo/operación e identificadores en auditoría, sin contenidos privados ni tokens. Entradas inválidas devuelven 400, recursos/perfiles fuera del contexto o permisos insuficientes 403, duplicados y estados incompatibles 409; errores internos están sanitizados en las nuevas rutas. Las rutas heredadas conservan su 403 para autenticación ausente; adjuntos conserva el 401 específico.

### Datos demo reproducibles

El perfil `demo` usa el datasource PostgreSQL configurado, mantiene Flyway activo y siembra directamente el conjunto ficticio `DEMO15-I1`–`DEMO15-I3` de forma idempotente. Para reproducir el flujo histórico H2 de copia existe el perfil separado `demo-snapshot`; no es el perfil de integración PostgreSQL. La guía [de integración local E2E](ui-ux/INTEGRACION_LOCAL_E2E.md) fija una base y un puerto efímeros, por lo que el perfil `demo,e2e` no puede iniciar contra una base ajena.

Con los valores predeterminados (`tutorlink.demo.tutors=20`, `students=300`), el conjunto añade:

- 3 instituciones y 3 administradores institucionales activos.
- 323 cuentas sintéticas: 20 tutores, 300 estudiantes y 3 administradores; 9 perfiles docentes reutilizan cuentas de tutores.
- 21 perfiles de tutor y 301 de estudiante: una cuenta participa con perfiles distintos en dos instituciones; un docente comparte cuenta entre tres escuelas.
- Roles DOCENTE/TUTOR combinados, distintos estados globales ficticios y asignaciones de tutoría independientes.
- 3 periodos, 9 cursos, 9 grupos con dos docentes asignados por grupo, 9 materiales y 9 sesiones.
- 18 tareas: ejercicios con fechas pasadas y permiso de tardías, y tareas futuras sin tardías; borradores, entregas ON_TIME/LATE y pendientes sin registro.
- Inscripciones, asistencias PRESENT/ABSENT/LATE/EXCUSED, consultas OPEN/IN_PROGRESS/CLOSED de materias y conversaciones de tutoría en los estados heredados.

Las claves, correos, textos y fecha de referencia (`2026-10-12T12:00:00Z`) son fijos; no se generan sufijos aleatorios ni se reclasifican estados al repetir. Una segunda siembra no duplica filas. Una colisión parcial con el espacio reservado demo falla antes de sobrescribir datos. Los hashes de contraseña usan BCrypt con sal; reproducibilidad se refiere a claves y contenido lógico.

Correos sintéticos estables: `admin1.demo15@example.invalid`–`admin3.demo15@example.invalid`, `tutor1.demo15@example.invalid` y `estudiante4.demo15@example.invalid` como ejemplos activos de cuenta compartida. La contraseña demo se configura con `tutorlink.demo.password` (predeterminada `TutorLinkDemo2026!`). El correo demo se simula en consola; no se envía a personas reales. Los IDs reales se consultan por las rutas de listado; no se asumen números fijos cuando se copia un origen existente.

### Verificación y despliegue

V30 se valida con Flyway sobre PostgreSQL 16, tanto en instalación nueva como migrando V29 con perfiles, asignación de tutor y pregunta históricos. La prueba comprueba conservación de IDs, datos, estado global e idempotencia de la migración. Las suites HTTP cubren H2 y PostgreSQL, aislamiento, invitaciones, roles múltiples, importaciones, OTP contextual y regresión de adjuntos/tutorías. El smoke test previamente deshabilitado ahora utiliza la infraestructura de integración.

Testcontainers necesita acceso al socket Docker y la propiedad **docker-java** `api.version`; `DOCKER_API_VERSION` por sí sola no configura ese cliente. Maven establece `api.version=${docker.api.version}` (1.40, compatible con el daemon verificado), configurable con `-Ddocker.api.version=...`. No se deshabilitan pruebas para obtener éxito.

```sh
mvn -o -f backend/pom.xml -Dtutorlink.build.directory=/tmp/tutorlink-15-build test
```

El directorio alternativo evita mezclar artefactos del IDE con javac. En un entorno sin Docker, los tests existentes anotados `disabledWithoutDocker` informan omisiones; esos resultados no equivalen a aprobación PostgreSQL. En esta ejecución se usa Docker accesible y se reportan los resultados efectivos.

Resultado del 12 de octubre de 2026: suite completa **275 pruebas, 0 fallos, 0 errores y 0 omitidas**, incluyendo Testcontainers/PostgreSQL y actualización V29 → V30 con historial heredado. `mvn -o -f backend/pom.xml -Dtutorlink.build.directory=/tmp/tutorlink-15-build -DskipTests compile` también finalizó correctamente. `git diff --check` no detectó errores de formato. Graphify actualizó el grafo de código; la extracción SQL permanece limitada por la dependencia opcional `tree_sitter_sql` ausente, sin afectar las verificaciones Flyway reales.

Antes de desplegar: respaldar la base, aplicar V30 mediante Flyway y desplegar el código compatible conjuntamente; las columnas/relaciones nuevas no deben usarse contra V29. Ninguna herramienta de esta ejecución aplica cambios a una base de producción. Se requieren configuración de SMTP y URL del frontend para entrega de invitaciones. El autoservicio personal, cambio de correo principal verificado y nuevos endpoints globales de SUPER_ADMIN quedan explícitamente para una fase posterior. No se implementa frontend, Cloudinary, WhatsApp ni facturación.


### Consumo frontend: contexto desde Mi perfil

El selector institucional se encuentra en Instituciones y contexto de trabajo dentro de Mi perfil. La identidad y salida están al pie del sidebar, también en el menú móvil. No cambia el contrato GET `/api/auth/institutions` / POST `/api/auth/context` ni la autorización del backend. El catálogo SUPER_ADMIN continúa separado de las membresías académicas. Rutas y comportamiento: [Navegación y sesión](ui-ux/NAVEGACION_SESION.md).

### Fase 2B.4: cursos, periodos, grupos y relaciones

La administración académica se resuelve siempre desde la institución del JWT contextual. Las altas no reciben `institutionId` del cliente y devuelven `201 {"id": ...}`:

| Método | Ruta | Permiso | Entrada/resultado |
| --- | --- | --- | --- |
| POST | `/api/admin/academic/periods` | ADMIN institucional | `{code,name,startsOn,endsOn}` |
| GET | `/api/admin/academic/periods` | ADMIN institucional | `q,page,size`; página `content,page,size,totalElements,totalPages` |
| POST | `/api/admin/academic/courses` | ADMIN institucional | `{code,name,description}` |
| GET | `/api/admin/academic/courses` | ADMIN institucional | búsqueda y paginación |
| POST | `/api/admin/academic/groups` | ADMIN institucional | `{courseId,periodId,code,name}` |
| GET | `/api/admin/academic/groups` | ADMIN institucional | `q,courseId,periodId,page,size` |
| POST | `/api/admin/academic/groups/{groupId}/teachers` | ADMIN institucional | `{teacherId}` de `profiles.DOCENTE`; `204` |
| GET | `/api/admin/academic/groups/{groupId}/teachers` | ADMIN institucional | docente sanitizado, `q,page,size` |
| POST | `/api/admin/academic/groups/{groupId}/enrollments` | ADMIN institucional | `{studentId}` de `profiles.ESTUDIANTE`; `204` |
| GET | `/api/admin/academic/groups/{groupId}/enrollments` | ADMIN institucional | `q,status=ACTIVE|WITHDRAWN|ALL,page,size` |
| DELETE | `/api/admin/academic/groups/{groupId}/enrollments/{studentId}` | ADMIN institucional | retiro lógico; `204` |
| GET | `/api/teacher/courses` | DOCENTE | grupos asignados, página académica |
| GET | `/api/student/courses` | ESTUDIANTE | grupos con inscripción `ACTIVE`, página académica |

Las lecturas administrativas de docentes solo incluyen `teacherId`, código, nombre, apellidos, departamento, especialidad y `assignedAt`. Las de estudiantes incluyen `studentId`, matrícula, nombre, apellidos, carrera, plan, semestre, estado y fechas de inscripción/retiro. Nunca incluyen correo ni identidad global completa. Los grupos inexistentes o de otra institución responden `403` uniforme; paginación fuera de 1–100 y estados desconocidos responden `400`; duplicados o conflictos permanecen en `409`.

El retiro actualiza `status=WITHDRAWN` y conserva la fila. El POST de inscripción existente reactiva una fila retirada. No existe endpoint para retirar docentes. Las asignaciones Docente–Grupo, inscripciones Estudiante–Grupo y tutorías Tutor–Estudiante continúan siendo relaciones independientes.

React consume estos envelopes mediante `frontend/src/api/academicApi.js`, convierte mapas `snake_case` a modelos de vista y descarta respuestas de generaciones de contexto anteriores. Las rutas disponibles son `/admin/periods`, `/admin/courses`, `/admin/groups`, `/teacher/courses` y `/student/courses`; no ofrecen enlaces funcionales a tareas, clases, entregas, asistencia o adjuntos en esta fase.

## Edición de catálogos académicos desde detalles (18-10-2026)

El panel ADMIN muestra «Ver detalles» en cada periodo y curso. El formulario conserva los datos ante errores y vuelve a consultar el listado tras guardar. La institución procede exclusivamente del JWT; no se envía en el DTO.

| Método y ruta | DTO | Respuesta | Permisos |
| --- | --- | --- | --- |
| `PUT /api/admin/academic/periods/{id}` | `{code,name,startsOn,endsOn,status}` | `204` | ADMIN o SUPER_ADMIN con contexto institucional vigente |
| `PUT /api/admin/academic/courses/{id}` | `{code,name,description,active}` | `204` | ADMIN o SUPER_ADMIN con contexto institucional vigente |

`code` obligatorio hasta 50 caracteres; `name` obligatorio hasta 140 para periodos y 180 para cursos. Fechas ISO `YYYY-MM-DD`, con fin igual o posterior a inicio. `status` del periodo admite `ACTIVE` o `INACTIVE`; `active` del curso es booleano obligatorio. Ejemplo de periodo: `{"code":"2027-A","name":"Primavera","startsOn":"2027-01-01","endsOn":"2027-06-30","status":"ACTIVE"}`.

Se actualiza únicamente la fila perteneciente a la institución activa. Recursos ajenos o inexistentes: `403`; entradas inválidas: `400`; códigos repetidos o restricciones: `409`. Se revalida el acceso institucional en base de datos. Los eventos `ACADEMIC_PERIOD_UPDATED` y `ACADEMIC_COURSE_UPDATED` se guardan en la transacción con el actor y el recurso. No se elimina ni recrea el catálogo ni sus relaciones.

La paginación React compartida ahora muestra índices, página actual y salto directo; se centra en usuarios, invitaciones, catálogos académicos, materias y consultas/tutorías. Los detalles de grupos y de asignaciones de tutores muestran cinco filas por página y scroll interno. La agrupación de tutorías conserva su contrato heredado; no se mezcla con Docente–Grupo.
