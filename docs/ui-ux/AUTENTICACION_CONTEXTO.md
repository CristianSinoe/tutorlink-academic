# Autenticación y contexto implementados — fase 2B.1

Fecha: 13 de octubre de 2026. Esta fase implementa código React sobre la arquitectura existente. No cambia backend, migraciones V27–V30, autoridades JWT ni el esquema de autenticación. Contratos: [CONTRATO_API_CURSOS.md](../CONTRATO_API_CURSOS.md). Diagnóstico original: [AUDITORIA_UX.md](AUDITORIA_UX.md).

Actualización 2B.2: login, OTP, primer acceso e invitaciones mantienen TutorLink. `ThemeProvider` no realiza solicitudes de branding ni altera JWT, contexto, guardias o cambio de institución. Véase [PERSONALIZACION_INSTITUCIONAL.md](PERSONALIZACION_INSTITUCIONAL.md).

## Sesión y compatibilidad

AuthProvider usa un store observable único consumido también por Axios. Los dashboards y la gestión heredada leen identidad desde AuthContext, no desde copias de localStorage. El registro `auth` tiene versión 2 y contiene token, role legado, institutionId, roles, email, name y selectedRole. Solo esos datos de sesión se persisten; opciones, catálogo global, estados de proceso, generación de peticiones y destinos de navegación permanecen en memoria. Contraseñas, códigos OTP y pruebas de invitación no se guardan en almacenamiento.

El rol legado se conserva como dato de compatibilidad; las guardias y espacios usan roles autorizados. El rol visual no concede privilegios ni cambia el JWT. Registros anteriores o malformados requieren login. Restaurar un registro bloquea las vistas privadas hasta comprobar opciones y reemitir el contexto institucional real; roles revocados no se reconstruyen desde el dato legado. Fallo de red ofrece reintento, y un rechazo de la comprobación de sesión solicita reautenticación.

El nombre de escuela procede de opciones devueltas por el servidor. Si SUPER_ADMIN recarga estando en ámbito institucional sin una membresía que proporcione ese nombre, se muestra el ID contextual confirmado; recuperar el catálogo global requiere reautenticación. No se inventan nombres, roles ni instituciones.

## Flujos y rutas disponibles

| Ruta React | Comportamiento implementado |
| --- | --- |
| `/login` | Credenciales, reCAPTCHA real y acceso inmediato sin preloader decorativo; correo principal personal o institucional |
| `/login?access=platform` | Entrada explícita de plataforma; el backend debe devolver PLATFORM_SUPER_ADMIN |
| `/otp` | Institución única visible o selección obligatoria entre varias antes de verificar; reenvío/cooldown y prueba renovada |
| `/context` | Identidad, institución y elección de espacios realmente autorizados |
| `/teacher` | Bienvenida docente y contexto actual; sin módulos académicos simulados |
| `/platform` | Consulta real de instituciones, estados activo/inactivo y entrada contextual; sin CRUD SaaS |
| `/accept-institution-invitation` | Aceptación verificada para cuenta actual, existente sin sesión o nueva |
| `/access-denied` y rutas desconocidas | Recuperación sin presentar una denegación de recurso como pérdida de sesión |
| `/admin/**`, `/student/**`, `/tutor/**`, `/first-login` | Conservan módulos existentes, ahora detrás de guardias/contexto compatibles; primer acceso no se sustituye por invitación |

La identidad, institución y rol se muestran al pie del sidebar; el cierre de sesión está inmediatamente debajo. Los selectores de institución y rol y la actualización de opciones están en Mi perfil. La cabecera anuncia el procesamiento. Véase [Navegación y sesión](NAVEGACION_SESION.md) para las rutas y la adaptación móvil. Los destinos `next` se limitan a rutas internas de espacios autorizados o aceptación de invitación; se rechazan destinos externos y recorridos de ruta manipulados. Una ruta todavía no implementada muestra página no encontrada, sin aparentar funcionalidad terminada.

API utilizada sin nuevas estructuras: POST `/api/auth/login`, `/login/verify-otp`, `/login/resend-otp`, `/context`; GET `/api/auth/institutions`; GET `/api/platform/institutions`; POST `/api/institution-invitations/accept`. Se conserva POST `/api/auth/first-login/complete` y las llamadas heredadas de tutoría/administración. JwtResponse e InstitutionOption se validan antes de publicar sesión/opciones.

## Transiciones, aislamiento y errores

Cambiar institución requiere una opción obtenida del servidor y confirmación de descarte de formularios. El store marca procesamiento antes de la petición; el cliente bloquea nuevas escrituras, espera las iniciadas y envía el contexto anterior para solicitar el nuevo JWT. Solo publica la nueva sesión si el ID y la identidad corresponden a la solicitud, después de persistir correctamente. Si falla petición, validación o almacenamiento, se conserva la sesión anterior.

Cada petición tiene una generación de sesión; respuestas antiguas, incluidas las de autenticación cuando la sesión cambió, se descartan. Las pantallas privadas se remontan al cambiar generación para eliminar estados locales antiguos. Un destino de navegación coordinado evita que la guardia del espacio anterior sobrescriba la nueva ruta; las guardias no restituyen un rol abandonado durante esa transición. Login/OTP tampoco aplican respuestas exitosas a una pantalla ya abandonada.

No se hacen reintentos automáticos de escrituras. Un 403 de recurso no borra por sí solo la sesión. Cuando las opciones autenticadas confirman que los roles actuales cambiaron, se reemite el JWT del contexto; si ya no hay acceso, se solicita reautenticación. Una comprobación fallida del nuevo contexto bloquea el contenido hasta revalidar. Los errores de cambio, red, validación y acceso tienen mensajes de recuperación sin SQL ni pruebas secretas. El cliente tiene timeout de 20 segundos; un timeout de escritura no acredita que el servidor haya revertido la operación.

SUPER_ADMIN global consulta plataforma, no supone que el listado de membresías contiene todas las escuelas. El catálogo autorizado permanece en memoria al entrar a un contexto; nunca se conserva otro JWT global. “Volver a plataforma” cierra sesión y dirige a reautenticación explícita con contraseña/código. No se llama `/context` con institutionId nulo. La autorización académica adicional sigue perteneciendo al backend.

## Invitaciones

El arranque captura la prueba antes de montar React o iniciar consultas; la página conserva un mecanismo equivalente para navegación SPA. Se reemplaza URL/historial y se mantiene únicamente memoria temporal para el recorrido SPA. Recargar requiere reabrir el enlace original; navegar a login desde el enlace interno conserva la prueba en memoria. No existe inspección REST de invitaciones ni selección libre de su escuela/rol.

- Cuenta autenticada: `{token}` vincula solo al actor que el servidor autorice.
- Cuenta existente sin sesión: `{token,password}`. Con otro correo principal, se orienta a login para vincular la cuenta existente.
- Cuenta nueva: `{token,name,lastNamePaterno,lastNameMaterno,password}`, con confirmación local. El servidor determina el contacto invitado; no se solicita un correo nuevo ni se envían roles.

Vencida, cancelada, utilizada y cuenta incorrecta comparten el rechazo 403 del servidor. La interfaz no afirma conocer cuál ocurrió; propone revisar la cuenta o solicitar una nueva invitación. Tras respuesta válida se borra la prueba, confirma vinculación y ofrece login o revalidación de sesión/opciones. UserResponse nunca se convierte en JWT. `/first-login` y cambio de contraseña siguen disponibles para sus flujos heredados.

## UI/UX y accesibilidad verificadas

H1: estados de restauración, carga, cambio, fallo y confirmación. H2/H6: correo principal, institución y espacios distinguibles. H3/H5: confirmación, cancelación/Escape, bloqueo de escrituras y selección previa a OTP. H4/H7: cliente/sesión comunes y alternancia sin cerrar sesión. H8: sin espera de marca, métricas ficticias o botones académicos decorativos. H9/H10: errores recuperables e instrucciones de invitación/reautenticación.

Los diálogos nuevos tienen título/descripción, foco inicial, ciclo Tab/Shift+Tab, restauración al cancelar y fondo inert. Después de un cambio se orienta el foco al contenido. Las nuevas superficies tienen controles nombrados, regiones de estado/error, foco visible y objetivo táctil mínimo de 44px. Verde de marca se conserva como identidad; acciones de autenticación usan verde oscuro con blanco y foco azul, evitando el par blanco/#28AD56 (2,92:1). Azul/blanco ofrece 7,68:1 y verde #166534/blanco 7,13:1 sobre fondos opacos.

Se inspeccionaron capturas reales de Electron a escritorio y 375px; el encabezado móvil no comprime la identidad y la página no desborda horizontalmente. No se ejecutaron lector de pantalla, axe-core, Lighthouse, zoom completo o pruebas con participantes. WCAG 2.2 AA es objetivo; no se certifica conformidad completa ni se consideran corregidos todos los modales/estilos heredados.

## Verificación y límites

La suite ampliada comprende **73 pruebas Vitest en 15 archivos**, con contratos simulados y cliente/transporte reales en pruebas de transición. **15 recorridos Cypress en 6 specs** cubren navegador Electron, HTTP simulado, OTP/contextos/roles/invitaciones y regresión administrativa/estudiantil/tutoría. Resultado final: 73/73 Vitest y 15/15 Cypress aprobadas, 0 fallidas y 0 omitidas. ESLint terminó sin errores ni advertencias; build Vite correcto. `git diff --check` y enlaces locales correctos. No se deshabilitaron pruebas. El build conserva una advertencia de paquete principal superior a 500kB por las dependencias existentes; la optimización global queda fuera de alcance.

Comandos reproducibles desde `frontend/`:

```sh
npm test
npm run lint
npm run build
# Servidor para Cypress simulado, con el widget reCAPTCHA interceptado por los tests:
VITE_RECAPTCHA_SITE_KEY=test-site-key npm run dev -- --host 127.0.0.1
env -u ELECTRON_RUN_AS_NODE node_modules/.bin/cypress run --browser electron
```

Cypress 13.17.0 estaba instalado. Su arranque fallaba porque ELECTRON_RUN_AS_NODE convertía Electron en Node; se resolvió sin instalar dependencias ni silenciar errores. También se actualizó la carga asíncrona del mock reCAPTCHA y el test de importación al Excel que la pantalla existente utiliza. El frontend no tiene bypass basado en `window.Cypress`; los mocks residen únicamente en tests.

El hosting debe evitar registrar el parámetro de prueba de la petición inicial al enlace: el frontend puede limpiar historial y evitar logs propios, pero no controla los access logs del servidor estático.

La integración local real está documentada en [INTEGRACION_LOCAL_E2E.md](INTEGRACION_LOCAL_E2E.md). Usa un PostgreSQL temporal, Flyway, datos sintéticos y las claves públicas oficiales de prueba de reCAPTCHA. El OTP se conserva sólo en el transporte de correo en memoria del proceso de perfil `demo`; la batería local lo consulta mediante IPC controlado y no por una ruta HTTP ni una variable Vite. Las pruebas simuladas siguen siendo distintas de esta comprobación de servidor.

## Administración institucional 2B.3

Las consultas y mutaciones de `/api/admin/institution/**` pasan por Axios contextual existente; nunca aceptan ni fabrican un `institutionId` desde React. Al cambiar institución, la generación de sesión descarta la respuesta de listado, ficha o invitación que haya quedado en vuelo y el cliente mantiene el bloqueo de escrituras ya definido. Un 403 en administración muestra recuperación local; no equivale a cerrar la sesión.

Las vistas de usuarios e invitaciones no mantienen un caché transversal de institución. La identidad global se presenta solo como información, mientras perfiles, roles y estados se solicitan para el contexto vigente. Las invitaciones no muestran ni persisten pruebas de aceptación.

Pendientes: integración real, lectura de pantalla/zoom y usabilidad con personas; administración institucional rediseñada y módulos académicos/SaaS; recuperación global sin reautenticación requiere nuevo soporte backend. Persistencia cross-tab no sincroniza automáticamente cambios de otra ventana: cada instancia mantiene su sesión verificada hasta nueva validación/logout. La creación heredada de tutorías conserva el problema N10 de reCAPTCHA fijo, documentado en 2A y ajeno al flujo de login implementado aquí. No se declara esa operación probada con CAPTCHA real.

## Archivos afectados

- Sesión/transporte: `main.jsx`, `context/AuthContext.jsx`, `context/sessionStore.js`, `context/invitationMemory.js`, `api/axiosClient.js`.
- Rutas y espacios: `App.jsx`, `router/ProtectedRoute.jsx`, `router/RoleRoute.jsx`, guardias ADMIN/TUTOR/ESTUDIANTE y `pages/context/*`.
- Flujos/componentes: LoginPage, OtpPage, InvitationAcceptPage, primer acceso (solo saneamiento de log), `components/context/*`, layouts, index.css y lectores de identidad de AdminDashboard/StudentDashboard/UsersPage.
- Pruebas: fixtures/proveedores, Login/OTP/guardias, ContextTransactions, WorkspaceNavigation, InvitationAccept/FirstLogin y specs/support Cypress; fixture XLSX sintético.
- Documentación: este documento, notas de ejecución en los cinco documentos 2A y contrato API. Graphify se actualiza con el código final.
