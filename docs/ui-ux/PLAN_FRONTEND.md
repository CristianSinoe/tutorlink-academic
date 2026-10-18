# Plan de implementación frontend — fase 2A

> Actualización 13/10/2026 — 2B.1 implementó autenticación/contexto y 2B.2 consolidó tokens, componentes comunes, estados de dashboard, diálogo accesible y reCAPTCHA de tutorías. No completa administración institucional V30, cursos ni módulos posteriores. Las verificaciones de navegador usan API simulada; la integración con Spring Boot operativo sigue pendiente.

Estado: plan pendiente de ejecución. La fase 2A únicamente crea documentación. No se alteran React, servicios backend, autenticación, permisos ni migraciones. Referencias: [auditoría](AUDITORIA_UX.md), [diseño](SISTEMA_DISENO.md), [heurísticas](HEURISTICAS_NIELSEN.md), [navegación](NAVEGACION_POR_ROLES.md) y [contrato API real](../CONTRATO_API_CURSOS.md).

## Clasificación y dependencias

- **Existente:** login/reCAPTCHA/OTP, primer acceso heredado, administración de estudiantes/tutores/asignaciones, consultas de tutoría, información propia y cambio de contraseña. Reutilizar estructura y probar regresión.
- **Nueva interfaz sobre backend existente:** contexto institucional/roles, invitaciones, perfiles locales, docentes, cursos/grupos/periodos, materiales/tareas/entregas/asistencia, consultas docentes, referencias autorizadas y SaaS.
- **Futura o condicionada:** perfil familiar, autoservicio de identidad/correo, directorio de tutorados, branding institucional persistente, carga segura, reapertura de entregas, edición/publicación posterior de materiales, indicadores/exports agregados y nuevas operaciones globales de cuenta. No mostrar acciones activas con endpoints inventados.

P0 contexto → shell/permisos → administración y selectores académicos → cursos → materiales/tareas/entregas → asistencia/consultas → referencias → SaaS. Los componentes comunes se ajustan con cada incremento; no bloquear el producto por construir primero una biblioteca extensa. Integrar metadatos de adjuntos en las pantallas académicas cuando se llegue al incremento 8; hasta entonces no simular archivos.

Los filtros UI se limitan a parámetros soportados. Las listas académicas y las institucionales tienen sobres distintos; centralizar adaptadores explícitos, no un “data.content || data.items || data” que silencie errores de contrato.

| Respuesta real | Uso y adaptación posterior |
| --- | --- |
| JwtResponse `{token,role,institutionId,roles,email,name}` | Sesión completa; role legado no autoriza módulos |
| OtpChallengeResponse `institutions` | Elección antes de verificar OTP; no guardar contraseña o prueba de invitación en auth |
| Usuarios `{items,total,page,size}` | Perfil/membresía local; status global solo lectura; UserDetail trae perfiles y estados por rol |
| Académica `{content,page,size,totalElements,totalPages}` | DTO PagedResponse; mapas snake_case; IDs de grupo/perfil no son automáticamente userId |
| Adjuntos `Metadata[]` | Array paginado sin total; máximo 100; tamaño de página completa no acredita última página |
| Plataforma | Arrays de instituciones/membresías; sin paginación servidor; no pasar parámetros ficticios |
| Tutoría | DTO y páginas heredados por endpoint |

Para arrays sin total, mostrar anterior/siguiente y admitir siguiente vacía, sin inventar número total. Adaptar `due_at`, `group_id`, `submitted_at` a modelo de vista de manera explícita; escrituras conservan camelCase de DTO. `studentId`/`teacherId` son IDs de perfiles: obtenerlos de respuestas locales, no enviar ID de cuenta por coincidencia numérica.

## Incrementos en el orden solicitado

### 1. Autenticación, institución e invitaciones — P0

**Reutilizar:** AuthProvider, useAuth, axiosClient, LoginPage, OtpPage, FirstLoginPage y reCAPTCHA instalado. **Añadir después:** selector de institución/rol y aceptación de invitación, sin alterar mecanismos de servidor.

API: POST `/api/auth/login`, `/login/verify-otp`, `/login/resend-otp`; GET `/api/auth/institutions`; POST `/api/auth/context`; POST `/api/institution-invitations/accept`. Consumir todos los campos contextuales. Institución explícita cuando varias; selección debe preceder consumo OTP. La aceptación no emite sesión: tras éxito solicitar login/contexto existente. Conservar rutas de primer acceso para personas heredadas.

Estados: credenciales inválidas, reCAPTCHA no disponible, envío/verificación, expiración, reenvío/cooldown real, sin institución activa, contexto no autorizado, prueba de invitación caducada/consumida y nueva/vinculada. Limpiar tokens de URL/logs; no cambiar JWT ni crear refresh. Acceso al formulario sin espera de marca.

**Aceptación:** dos instituciones y dos roles funcionan con contrato real; recarga y deep link no pierden orientación; next es interno/autorizado; no se usa email de contacto para sustituir principal. Dependencia externa: SMTP y URL de aceptación configuradas; con fallo de envío la administración consulta invitación y reenvía.

### 2. Navegación y permisos por rol — P0

Reutilizar layouts/Outlet/NavLink. Proponer composición común y guardias basadas en contexto recibido; agregar DOCENTE y SUPER_ADMIN, rutas 403/404 y menú separado de tutoría. InstitutionSelector, RoleSelector, feedback y Dialog se implementan solo tras aprobación de fase de código. Introducir captura de contexto para ignorar respuestas antiguas; no reutilizar datos entre escuelas o cuentas.

**Aceptación:** header refleja persona/escuela/rol reales; una URL no concede rol; cambiar escuela invalida estado previo; 403 de recurso no fuerza logout indiscriminado. SUPER_ADMIN distingue PLATFORM_SUPER_ADMIN global de SUPER_ADMIN institucional y respeta limitación de regreso global descrita en navegación. Teclado/menú móvil/foco se ensayan antes de ampliar el shell.

### 3. Administración institucional — P0/P1

Adaptar StudentsPage/TutorsPage/UsersPage, AdminFilterSelect, AssignmentsPage, ExcelImportHelp y ExportActions. Añadir vista DOCENTE, detalle local por rol e invitaciones; no crear cuenta directamente al buscar email ni editar datos globales. Desactivar formularios heredados de creación ADMIN en ámbito institucional al implementar, conservando consulta compatible.

API bajo `/api/admin/institution/users`:

- GET lista/detalle; PUT `/{id}/profiles/{role}`; POST `/{id}/roles`; PATCH `/{id}/roles/{role}/status`; DELETE `/{id}/roles/{role}`. Perfil y membresía son operaciones separadas: mostrar resultado parcial si una falla.
- POST `/invitations`, GET `/invitations`, POST `/invitations/{id}/resend`, DELETE `/invitations/{id}`. Token nunca se devuelve por UI administrativa.
- POST `/import-csv?role=...` con `{csv}` y `/import-excel?role=...` multipart `file`. Reporte por fila lógica y resultado; límite CSV 1000 registros/1M caracteres. No “usuario activo” por obtener 202.
- Asignaciones tutoría siguen `/api/admin/users/tutor-students`, `/assign`, `/{id}` y `/suggest-students` según métodos existentes. No reutilizar estas relaciones como docente–grupo.

Lista nueva con q, role, membershipStatus, filtro readonly global status, page=0 y size=20. Los filtros carrera/semestre/departamento de las listas heredadas no están respaldados todos por la nueva API: no filtrarlos solo sobre una página y presentarlos como filtro total; conservar donde el endpoint legado provea lista completa y dejar ampliación uniforme para futura API.

**Aceptación:** roles DOCENTE/TUTOR coexisten, cambios locales no alteran otras escuelas, estados rotulados por rol, identidad global readonly, invitación verificada antes de acceso, duplicados/reportes claros, datos conservados tras error seguro. Exports indican “página actual” si no se dispone de conjunto completo.

### 4. Cursos y materias — P1

ADMIN: GET/POST `/api/admin/academic/periods`, `/courses`, `/groups`; POST `/groups/{id}/teachers` con teacherId; POST `/groups/{id}/enrollments` con studentId; DELETE `/groups/{id}/enrollments/{studentId}`. Selectores de perfiles desde la gestión institucional. Periodo precede grupo; curso y periodo son selecciones visibles con nombres, no IDs escritos manualmente.

DOCENTE/ESTUDIANTE: GET `/api/teacher/courses` o `/api/student/courses`. Devuelven **grupos**, aunque ruta diga courses; una tarjeta debe indicar materia + grupo. Añadir q/paginación y vacío de asignación/inscripción distinto del fallo. El detalle puede construirse con grupo ya consultado y listados filtrados; no inventar GET `/courses/{id}`.

**Aceptación:** solo grupos asignados/inscritos, IDs correctos, errores de relación 403/409 traducidos. No hay GET administrativo dedicado de inscripciones por grupo ni DELETE de asignación docente; limitar el editor a operaciones disponibles y registrar necesidad futura de historial/directorio, sin llamar APIs docentes desde rol ADMIN.

### 5. Clases, materiales, tareas y entregas — P1

DOCENTE: GET/POST `/api/teacher/contents`, `/tasks`; creación con published verdadero/falso. CONTENT significa clase/material, sesión de asistencia es otra entidad. No hay PUT/PATCH de contenido/tarea ni publicación posterior expuestos: explicar decisión al crear y no ofrecer botones que simulen edición.

ESTUDIANTE: GET `/api/student/contents`, `/tasks` por groupId; GET `/tasks/{id}/submission`; PUT `/tasks/{id}/submission` con `{body,finalSubmission}`. “Guardar borrador” y “Entregar actividad” son acciones distintas. Para referencias, primero guardar DRAFT, consultar ID, asociar referencias y finalizar al final del flujo. DOCENTE GET `/api/teacher/tasks/{id}/submissions` revisa finales; no calificación o edición de cuerpos ajenos.

Estados: PENDING es ausencia de registro; DRAFT editable solo con tarea publicada y límite permitido; ON_TIME/LATE inmutables. `dueAt` inclusive; tras límite solo si allowLateSubmissions. Mostrar fecha/zona absoluta y advertencia sin afirmar que reloj local autoriza. Ante respuesta incierta al finalizar, consultar GET propio para reconciliar antes de repetir.

**Aceptación:** pruebas antes/exactamente/después del plazo, tardías sí/no, propios/ajenos, final inmutable, un doble clic no duplica. Sin autosave prometido, reentregas ni borradores almacenados globalmente en navegador.

### 6. Asistencia — P1

DOCENTE: GET/POST `/api/teacher/sessions`, GET `/api/teacher/groups/{id}/students`, PUT `/api/teacher/sessions/{id}/attendance` por alumno. ESTUDIANTE: GET `/api/student/attendance` y `/progress`. Sesión/roster dependen de grupo y perfiles válidos.

Tabla de asistencia con nombres, estados textuales y guardado por fila. No existe endpoint masivo ni GET docente dedicado de registros de asistencia por sesión: no simular precarga histórica ni “Guardar todo atómico”. Corregir asistencia exige identificar sesión y alumno; si se propone lote, cada resultado sería independiente y debe especificarse antes de implementarlo.

**Aceptación:** paginación de roster completa, identificación correcta estudiante, éxito/fallo por fila, historial propio con filtros; una celda sin registro conocido no aparece como ausencia confirmada. Lectura docente del estado actual queda como necesidad de API, no pantalla ficticia.

### 7. Consultas docentes y seguimiento — P1

GET `/api/teacher/questions` + detalle/mensajes; POST `/questions/{id}/messages` con body,primaryAnswer,close. Estudiante GET/POST `/api/student/course-questions` + detalle/mensajes y POST `/course-questions/{id}/messages` solo seguimiento. Reutilizar presentación de conversación de tutoría con adaptadores distintos, sin mezclar stores o mapas de estados.

No hay directorio estudiantil de docentes del grupo: targetTeacherId es opcional; ofrecer inicialmente consulta al grupo sin inventar selección de destinatarios. El responsable puede marcar principal/cerrar; otros asignados intervienen. CLOSED bloquea seguimiento; alumno no cierra ni marca principal.

**Aceptación:** destinatario/contexto claros, responsable identificable, pruebas de estados y roles, tabla/bandeja con filtros disponibles; tutor TUTOR solo conserva tutorías heredadas. Corregir token constante de StudentNewQuestion mediante reCAPTCHA real, manteniendo su contrato distinto.

### 8. Adjuntos y referencias autorizadas — P1

Reutilizar Metadata y nueva AttachmentList, no input de upload. POST `/api/attachments`, GET detalle/lista por resourceType/resourceId, GET `/{id}/content-reference`, POST `/{id}/unlink`; todas con actingRole apropiado. Recursos CONTENT/TASK/SUBMISSION; contexto de institución procede del JWT.

Detalle/lista/creación solo Metadata sin URL/publicId. Académico solicita URL al abrir; ADMIN/SUPER_ADMIN administrativo no ve acción de contenido, solo metadatos y desvinculación con motivo 1–500 caracteres. Metadatos antiguos pueden consultarse/desvincularse aunque apertura responda 409. No precargar URLs en caches administrativas ni confirmar existencia de adjuntos ajenos.

Registro solo HTTPS pública aprobada exactamente por institución. Catálogo vacío por defecto; **no hay endpoint que liste el catálogo**. Dependencia operativa: disponer de referencias y metadatos aprobados por el servidor; si no se proporcionan, no ofrecer un selector ficticio ni carga arbitraria. Una interfaz de registro puede ingresar la referencia conocida y tratar validación servidor, pero no afirmar aprobación antes de 201. MIME/tamaño proporcionados deben coincidir, nombre requerido y publicId omitido.

**Aceptación:** auth obligatoria, 403 uniforme, 409 de procedencia/conflicto explicado sin URL, unlink conserva historial y desaparece de activos, creación no declara subida, propio DRAFT/plazo protegido. Desvinculación no tiene “deshacer” REST ni elimina fichero externo.

### 9. Administración SaaS — P1 después de base contextual

Nuevo espacio `/platform`, solo global: GET/POST `/api/platform/institutions`, PUT `/{id}`, PATCH `/{id}/status`, GET `/{id}/memberships`, POST `/{id}/admins`, DELETE `/{id}/admins/{userId}`. Reutilizar tablas, formularios, estados y confirmaciones; no reutilizar alta administrativa heredada como concesión global.

Instituciones tienen code/name/timezone, no branding ni facturación. Conceder ADMIN requiere userId de cuenta existente; no existe búsqueda global de cuentas para autocompletar: limitar a IDs disponibles en membresías/procedimiento autorizado, documentar necesidad futura. No “dashboard global” de métricas inexistentes; inicio SaaS puede ser listado operativo real.

**Aceptación:** tokens institucionales no llaman plataforma; institución inactiva no se usa como contexto; confirmaciones describen alcance; no URLs privadas ni rol SUPER_ADMIN otorgado; regreso global por reautenticación hasta que exista operación apropiada.

## Tratamiento común de errores y concurrencia

| Situación | Experiencia propuesta |
| --- | --- |
| Entrada 400 | Campo/resumen útil; no exponer DTO/SQL; comparar con contrato vigente |
| Sin autenticación | Manejo según ruta: adjuntos 401, heredadas 403; confirmar sesión/contexto sin bucle ni logout indiscriminado |
| Recurso inexistente/ajeno/no permitido | Mensaje uniforme de acceso no disponible; no confirmar existencia en otra escuela |
| Conflicto 409 | Explicar operación afectada, reconsultar estado; no sobrescribir ni reintentar mutation automáticamente |
| Fallo red/5xx | Reintentar GET; para escrituras consultar resultado conocido antes de repetir; SMTP puede fallar después de guardar invitación |
| Cambio de institución concurrente | Capturar contexto antes de petición, cancelar/ignorar resultados viejos y deshabilitar escrituras durante cambio |

No instalar manejo de errores que transforme todos los fallos en “sesión expirada”. Mantener los límites específicos del backend y conservar feedback accesible durante transiciones.

## Plan de pruebas por incremento

1. **Componentes:** ampliar Vitest/Testing Library existentes con JwtResponse/contextos reales y envelopes correctos; rol combinado, dos escuelas, sin membresía, 403/409, carga/vacío/error, importación parcial, invitaciones y SMTP incierto. Mocks representan contrato; no sirven como evidencia de seguridad servidor.
2. **Navegador:** aprovechar Cypress instalado, distinguir mocks de API real; recorridos login/OTP/institución, navegación, administración, tareas/asistencia/consultas y regresión tutoría. Claves de reCAPTCHA de entorno de pruebas, sin introducir bypass productivo.
3. **API real:** utilizar backend demo H2 de fase 1.5, cuentas escolares conocidas y perfiles compartidos; obtener IDs de listados. Demo contiene fechas fijas del 12 de octubre de 2026: no asumir que un plazo sigue abierto el día de ensayo ni reclasificar finales. No probar con datos de producción.
4. **Accesibilidad/manual:** teclado completo, Escape/restauración de foco, anuncio de procesos, pegar OTP y password manager, lector de pantalla, texto 200%, reflow/zoom, movimiento reducido y objetivos táctiles. Ensayar 320/375/768/1024/1440px y teclado móvil; herramientas automáticas solo si están disponibles, sin instalación implícita.
5. **Usabilidad:** participantes representativos completan elección de contexto, suspensión de rol local, alta por invitación, entrega final y elección materia/tutoría. Medir finalización, errores, orientación y recuperación; sin métricas ficticias antes de observar.

Un incremento termina con integración real y estados, permisos, móvil/teclado y criterios Nielsen pertinentes comprobados, no por compilar. Registrar aprobadas/fallidas/no ejecutadas y motivo; nunca certificar AA únicamente con herramienta automática.

## Resultado real de la fase 2A y límites

Se entregan cinco documentos; suite frontend existente: 34 pruebas en 11 archivos, todas aprobadas, y ESLint correcto. No se ejecutaron e2e, evaluación visual, lector de pantalla, axe/Lighthouse ni una nueva suite backend. No se implementó selector, menú, vista académica o componente nuevo.

Dependencias pendientes concretas: SMTP/URL de aceptación; catálogo de referencias público configurado; futura lectura docente de asistencia y directorios de tutorados/docentes cuando se requieran; búsqueda global de cuentas y regreso contextual SaaS; branding persistente y operaciones académicas de edición/reapertura. Estas limitaciones no impiden comenzar contexto, navegación y gestión local con los endpoints existentes.

## Fase 2B.4 — implementación académica base

Se añadieron las rutas ADMIN `/admin/periods`, `/admin/courses` y `/admin/groups`, además de `/teacher/courses` y `/student/courses`. `academicApi` valida el envelope paginado y normaliza campos JDBC; los formularios comparten `Dialog`, `Field`, `Button`, `Table`, estados y paginación. El detalle de grupo obtiene docentes e inscripciones con lecturas administrativas autorizadas, usa IDs de perfil institucional en los selectores, excluye relaciones activas y confirma retiros.

La fase no crea pantallas de clases, tareas, entregas, asistencia ni adjuntos. La verificación HTTP H2 cubre las lecturas nuevas, sanitización, filtros de estado, paginación, retiro histórico y `403` para grupos ajenos. La spec Cypress real académica está preparada para el entorno PostgreSQL/OTP existente; su resultado debe reportarse por separado de los mocks y no se considera integración real si Docker o el backend no están disponibles.
