# Auditoría UI/UX — TutorLink, fase 2A

> Actualización 13/10/2026 — La fase 2A queda como diagnóstico histórico. La adaptación de sesión, OTP, contexto, guardias e invitaciones está implementada en 2B.1; los problemas de administración académica y módulos pendientes siguen fuera de ese incremento. Implementación y resultados: [AUTENTICACION_CONTEXTO.md](AUTENTICACION_CONTEXTO.md).

Fecha: 12 de octubre de 2026. Estado: diagnóstico y propuesta; ninguna interfaz descrita como nueva está implementada en esta fase.

## Alcance y método

Inspección del código React, rutas, layouts, estilos, formularios, llamadas Axios y pruebas existentes; contraste con [el contrato API](../CONTRATO_API_CURSOS.md) y los controladores/DTO reales. Se aplicaron las skills `tutorlink-ui-ux` (`/home/sinoe/.agents/skills/tutorlink-ui-ux/SKILL.md`) y Graphify. No se modificaron React, backend, autenticación, permisos o migraciones; no se instalaron dependencias.

Graphify ejecutó `query "frontend App AuthContext ProtectedRoute Dashboard Layout api roles routes"`, `path "App()" "apiClient"` y `explain "AuthProvider"`. La consulta amplia alcanzó 366 nodos y truncó el resultado a 76; se completó con recorrido focalizado y lectura de fuentes. El camino App → AdminAdminsPage → su archivo → apiClient acredita dependencia, no un flujo de ejecución ni permisos. El grafo sirve como mapa; la evidencia funcional procede del código.

Esta es una auditoría estática con pruebas de componentes en jsdom. No se ejecutaron navegador, Cypress, axe-core, Lighthouse, lector de pantalla ni sesiones con usuarios. No se certifica WCAG ni comportamiento visual en dispositivos. Graphify está disponible; su extracción SQL tiene la limitación conocida de `tree_sitter_sql` ausente. La skill UI/UX fue accesible. Las herramientas de evaluación visual no se instalaron ni ejecutaron.

## Arquitectura actual

| Área | Evidencia actual | Implicación |
| --- | --- | --- |
| Entrada | `frontend/src/main.jsx`: BrowserRouter y AuthProvider; `App.jsx`: Routes y Outlet mediante layouts | Ampliar rutas y layouts existentes, sin reemplazar React Router |
| Stack | React 19, Vite 7, JavaScript JSX; Tailwind 3, Axios, react-google-recaptcha | Aprovechar el stack instalado; no proponer migración a TypeScript como dependencia |
| Estilo | `index.css`, `App.css`, `tailwind.config.js`; `uvBlue`, `uvGreen`, neutrales slate | Identidad existente reutilizable; falta capa semántica común |
| Sesión | `context/AuthContext.jsx` persiste token, role, email y name en localStorage | Omite institutionId y roles; no representa V30 |
| API | `api/axiosClient.js` adjunta Bearer leyendo almacenamiento; `resolveApiBaseUrl.js` usa VITE_API_BASE_URL o host:8080 | Reutilizar cliente; faltan adaptación por dominio y manejo consistente de sesión/error |
| Seguridad visual | ProtectedRoute comprueba token; AdminRoute/TutorRoute/StudentRoute comparan auth.role | No hay guardias para DOCENTE/SUPER_ADMIN ni pertenencia contextual; el backend sigue siendo la autoridad |
| Datos | Llamadas HTTP y estados locales dentro de cada página, sin librería de caché compartida | Añadir servicios/adaptadores pequeños en una fase posterior, sin dependencia nueva obligatoria |
| Pruebas | Vitest, Testing Library, jsdom y Cypress ya declarados | Reutilizar infraestructura; los mocks actuales modelan contratos heredados |

La versión indicada procede de package.json, no implica verificación de compatibilidad de todas las dependencias. No se identificó una biblioteca general de Button/Input/Dialog/Table; hay helpers locales con esos patrones.

## Inventario de rutas y pantallas existentes

| Ruta React actual | Pantalla / cometido real | Evaluación |
| --- | --- | --- |
| `/login`, `/otp` | Credenciales, reCAPTCHA, OTP y reenvío | Conservar; adaptar opciones institucionales antes de verificar OTP |
| `/first-login` | Activación heredada | Conservar para enlaces existentes; no sustituye aceptación de invitaciones V30 |
| `/admin` | AdminDashboard | Resumen sobre cuatro listas heredadas; revisar métricas y alcance |
| `/admin/students`, `/admin/tutors` | StudentsPage, TutorsPage | Listas, filtros, alta/importación y edición; adaptar perfiles locales e invitaciones |
| `/admin/assignments` | AssignmentsPage | Asignación tutor–estudiante; conservar separación de docencia |
| `/admin/users`, `/admin/admins` | UsersPage, AdminAdminsPage | Estados/roles heredados; la concesión ADMIN pertenece al ámbito SaaS |
| `/admin/profile` | AdminProfilePage | Consulta de datos y cambio de contraseña existente |
| `/student` | StudentDashboard | Resumen de tutorías; no es aún resumen académico de cursos |
| `/student/ask`, `/student/questions` | StudentNewQuestion, StudentQuestions | Preguntas y conversaciones de tutoría, no consultas de materia |
| `/student/info` | StudentInfoPage | Datos propios desde `/api/me` |
| `/tutor` | TutorDashboard | Resumen y consultas recientes asignadas |
| `/tutor/pending`, `/tutor/history` | TutorPendingPage, TutorHistoryPage | Respuesta, rechazo, reclasificación, historial/conversación de tutorías |
| `/tutor/profile` | TutorProfilePage | Información de tutor y cambio de contraseña |

Las rutas de contexto, docente, plataforma e invitación están implementadas en 2B.1. Cursos, tareas, entregas, asistencia, adjuntos y CRUD SaaS siguen fuera de alcance. Las rutas restringidas y el comodín conservan la sesión y muestran recuperación contextual o 404.

## Hallazgos prioritarios

| ID | Evidencia / problema | Impacto y prioridad |
| --- | --- | --- |
| A01 | AuthContext conserva role único; LoginPage no pasa `institutions` al OTP; OtpPage no envía institutionId ni conserva roles/contexto | P0: una persona con varias escuelas no puede completar el flujo correcto; docentes/SUPER_ADMIN carecen de destino |
| A02 | Layouts carecen de selector/contexto; AdminLayout contiene `Admin Demo`; TutorLayout y login fijan Universidad Veracruzana | P0: la identidad de la escuela y la persona no corresponde necesariamente a la sesión |
| A03 | StudentsPage/TutorsPage exigen contraseña inicial y permiten editar nombre/email; StudentsPage guarda perfil y estado con dos peticiones | P0: contradice administración local, puede recibir 409 o guardar parcialmente; sustituir por invitación y perfil local |
| A04 | UsersPage presenta role y estado global ACTIVE/DISABLED/BLOCKED como gestión de cuentas | P0: confunde cuenta global de solo lectura con membresía ACTIVE/SUSPENDED/REVOKED |
| A05 | Corregido en 2B.2: StudentNewQuestion usa el widget y exige prueba antes de POST | Pendiente de integración real con claves/reCAPTCHA de prueba; no hay bypass productivo |
| A06 | Corregido de forma transversal para acciones con ambas clases mediante token positivo accesible | Revisar visualmente acciones heredadas que usen otros pares de color |
| A07 | Modal local en StudentsPage/UsersPage son divs sin semántica de diálogo; `<dialog open>` en otros componentes no utiliza showModal ni gestione foco | P1: riesgo de navegación de teclado detrás del modal; comportamiento real pendiente de navegador |
| A08 | Corregido en dashboard estudiante/tutor: carga, vacío y error son distintos y hay reintento de lectura | Métricas aún dependen de alcance real de los endpoints heredados |
| A09 | El dashboard evita ceros como datos confirmados y no afirma recencia verificable | El contrato administrativo V30 sigue pendiente de adopción completa |
| A10 | Usuarios/estudiantes/tutores descargan listas y paginan por cinco localmente | P1: escalar a paginación institucional real; filtros adicionales no tienen equivalente servidor uniforme |
| A11 | Inputs locales muestran error sin aria-invalid/describedby; OTP error no es región viva | P1: feedback accesible inconsistente, aunque otras páginas sí usan alert/status |
| A12 | CSS mezcla estilos hero y utilidades, gradientes y animaciones declaradas sin política de movimiento reducido | P2: inventariar usos antes de consolidar; no afirmar que cada clase animada produce animación |

P0 bloquea integración correcta/alcance; P1 afecta tareas o accesibilidad; P2 mejora consistencia. Severidad heurística y criterios verificables se detallan en [HEURISTICAS_NIELSEN.md](HEURISTICAS_NIELSEN.md).

## Aspectos aprovechables y límites

Los layouts ya usan landmarks, navegación activa con NavLink, Grid/Flex y separación desktop/móvil. Hay `overflow-x-auto` en tablas y navegación móvil; eso es una base responsiva, no prueba de ausencia de desbordamiento. Labels explícitos, autocompletado de credenciales, botones con estado disabled, feedback alert/live y estados con texto aparecen en varias pantallas: preservarlos.

Logo y sus SVG, AdminFilterSelect, ExportActions/adminExport, ExcelImportHelp, ChangePasswordModal, dateUtils y conversaciones de tutoría ofrecen reutilización concreta. Los helpers locales Input/Modal/StatusBadge/SummaryCard son candidatos a extraer más adelante después de unificar semántica; no son componentes compartidos terminados. Los exports deben indicar si contienen solo página actual; no descargar todas las escuelas ni prometer exportación completa sin soporte.

## Validación ejecutada en esta fase

| Comprobación | Resultado real | Qué no demuestra |
| --- | --- | --- |
| `npm test` en frontend | 11 archivos, 34 pruebas aprobadas, 0 fallidas | Integración V30, navegadores, acceso entre escuelas o conformidad WCAG |
| `npm run lint` | Exit 0, sin errores | Corrección del contrato API o usabilidad |
| Cálculo de contraste sRGB, Python estándar | Blanco/verde 2,92; blanco/azul 7,68; blanco/#166534 7,13 | Gradientes, transparencias, hover/foco reales |
| Lectura contrato/controladores/DTO y Graphify | Desfases y dependencias identificados | Pruebas de uso con personas |

No se ejecutó suite backend en esta fase documental. Las 275 pruebas del backend reportadas en fase 1.5 son antecedente, no una ejecución nueva. No se ejecutó build React porque no hay cambios de código. La validación manual propuesta comprende teclado, lectores de pantalla, 320/375/768/1024/1440 px, zoom, estados de red y cuentas demo con varios roles/instituciones. Véase [PLAN_FRONTEND.md](PLAN_FRONTEND.md).

## Revisión implementada — rediseño administrativo, 18/10/2026

La auditoría anterior se conserva como registro histórico. Esta revisión trabaja sobre `eee56ae`, con la administración V30, los catálogos académicos y la paginación de 10 filas ya existentes. No modifica backend, adaptadores, rutas, contratos, autenticación ni autorizaciones.

Diagnóstico comprobado con fuentes y capturas en laptop/móvil:

| Hallazgo | Impacto | Tratamiento aplicado |
| --- | --- | --- |
| Contenedor único y sidebar azul pesado | Poco ancho útil en tablas y jerarquía insuficiente | Variante administrativa clara, navegación agrupada, contenido hasta 1600 px |
| Diálogo normal/amplio sin distinción por tarea | Formularios estrechos y gestión compleja con scrolls anidados | Cuatro tamaños semánticos; encabezado y pie independientes del único cuerpo desplazable |
| Utilidades locales y padding global `!important` | Densidad y controles inconsistentes | Tokens administrativos delimitados; conservación del estilo anterior fuera de ADMIN |
| Cierre sin proteger borradores | Pérdida accidental de datos | Confirmación de descarte dentro del mismo diálogo y cierres bloqueados durante escritura |
| Confirmación nativa al retirar tutoría | Interacción y foco diferentes al resto del panel | Confirmación accesible dentro de la gestión existente, antes del mismo DELETE |
| Desbordamiento con texto duplicado | Scroll horizontal global en móvil/zoom | Región de tabla posicionada para contener sus etiquetas accesibles; cabeceras y paginación con wrap |

Las capturas anteriores se obtuvieron sirviendo una copia temporal de `eee56ae` en 5175; el rediseño se verificó en 5174. No se alteró el servidor del usuario. Los archivos normalizados de comparación se conservan localmente en `frontend/cypress/screenshots/admin-redesign-evidence/`, con prefijos `before`/`after`, anchos 375 y 1366, y cinco superficies: usuarios, perfil, asignaciones, grupo y formulario. Son artefactos de prueba ignorados por Git y se regeneran con la spec `admin-redesign.cy.js` y `DESIGN_CAPTURE=before|after` contra cada versión.

Límites conservados: la consulta completa de perfiles para filtros/exportaciones, el límite existente de los catálogos/selectores y la política de cuenta global/membresías siguen siendo los de la aplicación previa. No se presentaron cambios de datos o de API como mejoras visuales.
