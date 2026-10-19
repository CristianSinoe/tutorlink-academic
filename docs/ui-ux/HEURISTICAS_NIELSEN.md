# Evaluación heurística de Nielsen — fase 2A

> Actualización 13/10/2026 — 2B.2 incorpora estados distinguibles de carga/vacío/error, reintentos seguros de lectura, diálogo común accesible, controles con foco visible, tabla desplazable y reCAPTCHA real en la creación de tutorías. N01, N05, N08, N10, N16, N17 y N18 tienen correcciones parciales verificadas por pruebas. N04, N09, N14 y N19 siguen condicionadas por la adaptación de operaciones administrativas heredadas al contrato V30; no se declaran resueltas.

Fecha: 12 de octubre de 2026. Evaluación por inspección de código; no prueba de usabilidad con personas ni correcciones implementadas. Evidencia y límites: [AUDITORIA_UX.md](AUDITORIA_UX.md). La referencia de las diez heurísticas es [Nielsen Norman Group](https://www.nngroup.com/articles/ten-usability-heuristics/).

Escala: 0 sin problema identificado; 1 cosmético; 2 menor; 3 importante; 4 crítico para completar la tarea. La severidad expresa impacto esperado sustentado en la evidencia; frecuencia real pendiente de observación. Todos los hallazgos están **pendientes**. Una ausencia de evidencia no equivale a conformidad.

## Registro de problemas y aceptación

| ID / heurística | Pantalla y evidencia | Problema | Severidad y fundamento | Solución propuesta | Criterio de aceptación |
| --- | --- | --- | --- | --- | --- |
| N01 — H1 Visibilidad del estado | StudentDashboard, loadQuestions: catch deja [] y solo console.error; loadMe también solo consola | Fallo se confunde con actividad vacía | 3: una indisponibilidad cambia el significado del resumen | ErrorState con reintento y métricas desconocidas; vacío solo tras éxito | Simular fallo GET: muestra error, conserva datos previos si existen y no afirma cero/ausencia |
| N02 — H1 | LoginPage timer 5600ms y LoginPreloader timer 6000ms | Espera de marca no corresponde a petición real | 2: demora repetida de acceso, sin trabajo verificable | Formulario disponible de inmediato; busy solo durante operaciones | Desde montaje, controles disponibles sin espera fija; ninguna animación bloquea acceso |
| N03 — H2 Correspondencia con lenguaje y tareas | LoginPage/OtpPage: “correo institucional”, UV; layouts con institución fija | Promete una institución única y correo de dominio específico | 3: excluye mentalmente cuentas personales/multiinstitución válidas | “Correo principal de tu cuenta”; TutorLink común y escuela seleccionada | Personal e institucional se aceptan sin dominio; nombre de escuela proviene de opción autorizada |
| N04 — H2 | UsersPage USER_STATUS y AdminDashboard quick links sobre “bloquear cuentas” | Estado de cuenta y membresía parecen intercambiables | 4: induce decisión administrativa de alcance incorrecto | Mostrar cuenta global de solo lectura y estados locales por rol | Suspender TUTOR en A no cambia DOCENTE en A ni roles de B; UI refleja ambos después de refetch |
| N05 — H3 Control y libertad | Modales StudentsPage/UsersPage (div); ayuda/modal contraseña sin manejo de foco/Escape | Cierre visible pero navegación de teclado no contenida ni restaurada explícitamente | 3: interacción modal puede perder orientación | Dialog accesible compartido; Escape y botón Cancelar; foco vuelve al disparador | Tab/Shift+Tab permanecen dentro; fondo no interactivo; Escape cancela antes de envío; cierre devuelve foco |
| N06 — H3 | App.jsx comodín y guardias de rol redirigen a login; next se usa sin verificar destino permitido | URL errónea o rol distinto se interpreta como sesión ausente | 3: se pierde navegación y puede generarse ciclo | 404 y acceso restringido con volver/inicio/contexto; validar next interno y permitido | URL desconocida muestra 404 conservando sesión; acceso denegado no borra sesión válida ni salta entre login y OTP |
| N07 — H4 Consistencia | Login/Otp/AuthContext/guardias solo role; backend emite institutionId y roles | Navegación desalineada con contrato contextual | 4: varias instituciones y nuevos perfiles quedan sin flujo funcional | Contexto completo + menú por rol seleccionado dentro de roles vigentes | Cuenta DOCENTE/TUTOR puede alternar vistas autorizadas; dos instituciones requieren selección antes de OTP; role global no concede acceso |
| N08 — H4 | Modal/Input/StatusBadge duplicados; sidebar administrativa y pills tutor/estudiante | Patrones de cierre, botones y navegación dispares | 2: aprendizaje adicional y correcciones duplicadas | Extraer composición común gradualmente con menú por perfil | Mismas acciones comparten etiqueta/estado/foco; no se mezclan rutas docente/tutor |
| N09 — H5 Prevención de errores | StudentsPage/TutorsPage alta con password y edición global; StudentsPage PUT seguido de PATCH | Datos fuera del permiso y guardado parcial | 4: tarea de gestión no satisface reglas actuales | Invitación con contacto/perfil local; separar guardado perfil y membresía | Formulario no envía identidad/contraseña al editar perfil; fallo de segunda operación no afirma que todo se guardó |
| N10 — H5 | StudentNewQuestion hardcodea token de reCAPTCHA, StudentController lo verifica | La UI permite iniciar una operación que falla en entorno con verificación real | 4 para creación de tutoría: control requerido no existe en flujo actual | Reutilizar widget/validación del login para esa ruta, respetando backend | Sin prueba válida no se envía; con prueba real se obtiene confirmación; no usar token fijo fuera de mocks |
| N11 — H5 | StudentsPage valida semestre 1–15, nombre solo letras/espacios y birthDate obligatoria; DTO institucional semestre 1–20 sin fecha de nacimiento | Restricciones heredadas impiden entradas admitidas por nuevo contrato | 3: rechazo innecesario o carga de datos personales | Validación por DTO/operación; invitación contactEmail y perfil code, opcionales pertinentes | Semestre 20 válido no se rechaza; no exige fecha de nacimiento ni nombre global para editar perfil; límites del servidor se reflejan |
| N12 — H6 Reconocimiento | AdminLayout contiene Admin Demo; ninguno presenta institución activa o selector de roles | Usuario debe recordar su contexto y puede atribuir actividad a otra escuela | 4: contexto esencial ausente en administración multiinstitución | Header institución/rol verificado y selector visible | Todas las vistas institucionales muestran nombre/rol; tras cambio solo aparecen datos del nuevo contexto |
| N13 — H6 | StudentQuestions/StudentNewQuestion “preguntas académicas”; no hay módulo de materias | Tutoría y consulta docente tienen nombres superpuestos | 3: orientar a destinatario incorrecto | “Tutoría académica” separada de “Consultas de materia”; curso/grupo en estas últimas | Elegir materia crea course-question; elegir tutoría usa Question heredada; mensajes no cruzan módulos |
| N14 — H7 Eficiencia | UsersPage/StudentsPage/TutorsPage pageSize=5 y slice tras descargar lista | Paginación visual sin aprovechar servidor; filtros locales no escalan igual | 3: listas grandes y exportación ambigua | Página 20, filtros respaldados por API, preservar q/page en URL; exportar alcance declarado | Solicitud incluye page/size/filtros reales; cambio de filtro reinicia página; exportación declara página/lista disponible |
| N15 — H8 Minimalismo y relevancia | Preloader y login usan gradientes, blobs, lemas repetidos; App.css define hero/placeholder sin usos identificados en App | Jerarquía visual dedicada a decoración frente a tarea de acceso | 2: distracción; estética final pendiente de render | Marca breve y formulario prioritario; revisar estilos sin borrar código en fase 2A | Login ofrece primero tarea/contexto; sin retraso decorativo; contenido esencial a 320px y 200% texto |
| N16 — H8 | AdminDashboard calcula “últimas” con slice(0,5); StudentDashboard calcula totales sobre primeras 50 consultas | Indicadores sin alcance o recencia acreditados | 3: lectura administrativa equivocada | Etiquetar muestra/página; totales solo si API aporta conteo correcto; ordenar por dato respaldado | Con 51+ registros no afirma totales basados en 50; no llama recientes a filas sin orden temporal verificable |
| N17 — H9 Recuperación de errores | OtpPage error div sin alert/live; helper Input estudiante no vincula error; StudentNewQuestion usa alert() | Error no indica campo accesiblemente ni conserva orientación de forma uniforme | 3: recuperación lenta o inaccesible | Resumen accionable, error inline asociado, foco al primer inválido; preservar datos seguros | Lector anuncia error una vez; campo tiene describedby/invalid; usuario corrige sin reescribir datos no sensibles |
| N18 — H9 | Axios solo interceptor request; páginas repiten message/error y fallback, sin política central de sesión | Red, 403 de recurso y autenticación se interpretan inconsistentemente | 3: repetir login o envío sin necesidad | Normalización por operación: no tratar todo 403 como logout; refetch/proof/contexto según caso | 403 recurso muestra acceso restringido; 409 no expone SQL; respuesta incierta de entrega se reconcilia por GET antes de reenvío |
| N19 — H10 Ayuda y documentación | ExcelImportHelp dice “correos ya registrados se omiten” y describe alta/primer acceso heredado | Ayuda no describe invitaciones/reportes de V30 | 3: expectativa errónea de importación y activación | Guía del nuevo contrato con cabeceras, fila lógica, estados y reenvío | Ayuda y reporte distinguen creado/invitado/omitido/fallido; SMTP fallido propone consultar/reemitir sin mostrar token |
| N20 — H10 | OtpPage fallback cooldown 30s y texto fijo “cada 60 segundos” | Instrucción puede contradecir temporizador recibido | 2: confunde disponibilidad de acción | Texto/cuenta desde valor real devuelto; ayuda breve para expiración | Con cooldown 30 o 60 la etiqueta y ayuda coinciden; reenvío usa nuevo otpToken |

## Fortalezas a preservar

H1: varias páginas administrativas ya anuncian feedback alert/live y bloquean envíos durante carga. H3: OTP permite regresar al login y dialogs tienen cierre visible. H4/H6: NavLink y estados textuales dan orientación. H5: existen validaciones y botones disabled; se deben alinear, no eliminar. H7: búsqueda, filtros, exports y páginas existentes son base útil. H10: ExcelImportHelp es ayuda contextual reutilizable.

El contraste blanco/verde y foco son hallazgos transversales de accesibilidad detallados en [SISTEMA_DISENO.md](SISTEMA_DISENO.md), no una undécima heurística. No se afirma que cada hallazgo viole por sí solo un criterio WCAG antes de ensayar la interacción real.

## Orden de corrección y verificación futura

Primero N07/N12/N04/N09: contrato/contexto y alcance administrativo; después N10 y N06: tutoría real y navegación; a continuación N01/N05/N17/N18 y contraste; luego N14/N16/N19/N20/N08/N15. Corregir patrones compartidos una vez y verificar cada pantalla consumidora.

Para cada cambio: actualizar pruebas de componentes con contratos reales, ensayar error/vacío/conflicto, teclado y móvil, y ejecutar recorridos con usuarios ADMIN, DOCENTE, TUTOR y ESTUDIANTE. Registrar hallazgo → cambio → evidencia; ningún estado pasa a “resuelto” por escribir esta propuesta.

## Evidencia 2B.3

N04, N09, N14 y N19 se corrigieron en la administración institucional: la cuenta global es explícitamente de solo lectura, los estados operables pertenecen a cada membresía local, los filtros y la paginación se mandan al servidor V30, y los reportes de importación distinguen creados, invitados, omitidos y fallidos. Las suspensiones, revocaciones, reenvíos y cancelaciones solicitan confirmación; los errores recuperables se presentan sin borrar los datos del formulario. Esta evidencia cubre pruebas de componente y recorridos Cypress con API simulada. Sigue pendiente validación con personas, lector de pantalla y backend real.

## Evidencia 2B.4

Las pantallas académicas incorporan estados diferenciados de carga, error, vacío y filtros sin resultados (N01/N17/N18), diálogos con foco y validación de fechas (N05/N09), nombres de cursos y periodos en selectores en lugar de IDs manuales (N03/N06), y tablas con región desplazable y paginación real (N14). La asignación usa `profiles.DOCENTE` y la inscripción `profiles.ESTUDIANTE`; un conflicto `409` conserva el contexto y vuelve a consultar. La evidencia automatizada cubre Vitest y HTTP H2. La observación con usuarios, lector de pantalla y auditoría WCAG completa sigue pendiente.

### Recuperación de controles en administración institucional

- H1/H2/H4: roles y estados cuentan con etiquetas legibles y badges de colores diferenciados. El estado de cuenta sigue siendo de solo lectura.
- H5: el detalle de un estudiante no ofrece agregar roles; DOCENTE y TUTOR pueden combinarse, sin ofrecer ESTUDIANTE como rol adicional.
- H6/H7/H10: se recuperan filtros académicos, limpiar filtros, PDF, Excel y ayuda contextual en Usuarios, Estudiantes, Docentes y Tutores. Se retira el filtro visible de membresía; las operaciones locales vigentes de acceso se conservan.
- Las exportaciones incluyen todos los resultados filtrados, no solo la página visible. Se consultan las páginas y los detalles institucionales existentes (máximo ocho detalles concurrentes), sin endpoints globales. Una respuesta de otra generación de contexto cancela la recopilación. Limitación: esta recuperación requiere más lecturas en instituciones grandes; conviene incorporar proyecciones y filtros académicos de servidor en una fase posterior.
- No se inventa el filtro de asignación de tutor: el contrato institucional de usuarios no incluye esa relación. Las asignaciones siguen en su módulo independiente.
- Verificación automatizada: filtros, ayuda, acciones de exportación, restricción visual en estudiantes, paginación completa y cambio contextual. La revisión visual y de teclado en navegador queda pendiente de ejecución.

### Revisión de tablas y modales del 18-10-2026

| Superficie | Heurísticas | Problema y gravedad | Corrección |
| --- | --- | --- | --- |
| Listados | H4, H6, H7 | Navegación secuencial sin salto (2) | Índices centrados, página actual y salto directo con teclado |
| Tablas | H8 | Filas y columnas comprimidas (2) | Padding uniforme, interlineado y región de scroll horizontal |
| Roles | H5 | Selector sin opciones cuando ya existen DOCENTE y TUTOR (2) | Ocultar cuando no hay otro rol admitido |
| Asignaciones y grupos | H3, H8 | Modal largo y grupos estrechos (3) | Altura limitada, scroll, cinco filas por página y dos columnas en grupos en escritorio |
| Periodos y cursos | H1, H2, H9 | Falta de detalle editable (2) | Formulario con guardado real, errores recuperables y reconsulta |

H10: se mantiene la ayuda contextual ya recuperada. Las verificaciones automatizadas incluyen salto a página 10, estado deshabilitado durante carga, formulario conservado ante 409 y perfiles combinados. Las pruebas Cypress de diseño usan contratos simulados: no acreditan integración PostgreSQL ni conformidad WCAG completa.

Resultados efectivos de esta revisión: Vitest **104/104**, suite HTTP H2 `Phase15H2Test` **23/23**, lint y build Vite aprobados. Cypress con contratos simulados: `navigation-spacing.cy.js` **8/8** (grupos a 320/375/768/1024/1440 px, scroll/páginas, foco al cerrar, asignaciones, edición), `admin.cy.js` **4/4**, `academic.cy.js` **2/2**. La primera ejecución de `academic.cy.js` falló por una fixture DOCENTE ausente y por seleccionar un enlace oculto del sidebar; se corrigieron los datos y se acotaron los selectores al encabezado principal, manteniendo las aserciones. La repetición pasó. Evidencias en `frontend/cypress/videos/`. No se ejecutó la batería PostgreSQL real en esta revisión.

## Rediseño administrativo — 18/10/2026

| Heurística | Evidencia y severidad inicial | Corrección |
| --- | --- | --- |
| H1 Visibilidad | Guardados/actualizaciones poco claros (2) | Estados anunciables, indicadores reales de carga y confirmación |
| H2 Correspondencia | Estados técnicos expuestos (2) | Etiquetas legibles conservando enums y valores de formularios |
| H3 Control | Cierres que descartaban formularios (3) | Confirmar descarte, conservar borrador/foco y bloquear cierres al guardar |
| H4 Consistencia | Sidebar, formularios y modales heterogéneos (2) | Variante/tokens administrativos y tamaños semánticos |
| H5 Prevención | Retiro por confirmación nativa y cierres en escritura (2) | Confirmación dentro del diálogo y controles pendientes protegidos |
| H6 Reconocimiento | Menú sin categorías y perfil sin selección explicada (2) | Grupos con iconos/etiquetas y ayuda para seleccionar perfil |
| H7 Eficiencia | Ancho uniforme limita tareas de gestión (2) | Listados fluidos y gestión en columnas sin cambiar filtros/paginación |
| H8 Minimalismo | Sidebar pesado y scrolls anidados (3) | Navegación clara, superficies diferenciadas y un cuerpo modal con scroll |
| H9 Recuperación | Formulario/foco inestable ante cambios y errores (3) | Valores conservados, errores asociados cuando corresponde y callback de cierre estable |
| H10 Ayuda | Riesgo de ocultar controles al simplificar (2) | Ayudas, etiquetas y acciones existentes conservadas |

Se detectó y corrigió una regresión de reflow en las pruebas ampliadas: etiquetas `sr-only` de encabezados de tabla quedaban posicionadas fuera de la región horizontal y generaban scroll global (1730 px de ancho en un viewport de 683 px). La región ahora establece el contexto de posicionamiento y contiene esas etiquetas sin ocultar datos. Las mismas aserciones se mantuvieron al repetir las pruebas.
