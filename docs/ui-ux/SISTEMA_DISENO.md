# Sistema de diseño propuesto — TutorLink

> Actualización 13/10/2026 — 2B.2 implementa tokens semánticos en `index.css` y componentes comunes en `frontend/src/components/ui/`. `ThemeProvider` conserva la marca TutorLink sin solicitar branding; detalles y contrato futuro en [PERSONALIZACION_INSTITUCIONAL.md](PERSONALIZACION_INSTITUCIONAL.md). No se certifica WCAG sin ensayo manual.

## Implementación 2B.2

Los tokens cubren superficie, fondo, texto, borde, foco, información, éxito, advertencia y error. `Button`, `Field`, `Dialog`, `Alert`, `Badge`, `Card`, `PageHeader`, estados de carga/vacío/error y `Table` se usan donde hay consumidores reales. Las tablas exponen una región desplazable por teclado para conservar acciones a 320 px. El diálogo común atrapa el foco, responde a Escape, vuelve al disparador e inhabilita el fondo mientras está abierto.

Las acciones positivas con texto blanco usan `#166534`; `#28AD56` queda como color de identidad y no se usa como fondo de texto blanco.

Estado: especificación para implementación posterior. Conserva Tailwind, SVG y tipografía del proyecto. No crea componentes, CSS ni pantallas en fase 2A. Contexto y evidencia: [auditoría](AUDITORIA_UX.md).

## Identidad y tokens

Mantener verde `#28AD56` y azul `#18529D`. Usar neutrales para contenido, con color de marca en acciones y orientación. `uvBlue`/`uvGreen` siguen como base; proponer aliases semánticos sobre variables CSS en una fase posterior, sin sustitución masiva de utilidades.

| Token propuesto | Valor inicial | Uso |
| --- | --- | --- |
| brand-green | #28AD56 | Identidad, acentos y superficies con texto oscuro |
| brand-blue / action-primary | #18529D | Acción principal y enlaces sobre blanco |
| action-positive | #166534 | Confirmaciones/acciones verdes con texto blanco |
| on-brand-green / text | #0F172A | Texto principal; sobre verde de marca también |
| on-action-primary / on-action-positive | #FFFFFF | Texto de acción |
| background / surface | #F8FAFC / #FFFFFF | Fondo neutro y paneles |
| text-muted | #475569 | Texto secundario legible |
| border / control-border | #E2E8F0 / #64748B | Separación decorativa / límites necesarios de controles |
| success-text / success-surface | #166534 / #DCFCE7 | Éxito con etiqueta e icono opcional |
| warning-text / warning-surface | #92400E / #FEF3C7 | Advertencias/plazo |
| danger / danger-surface | #B91C1C / #FEF2F2 | Errores y acciones sensibles |
| info-text / info-surface | #18529D / #EFF6FF | Información |
| focus | #18529D en blanco; blanco en azul | Anillo contrastado, con separación del control |

Los bordes decorativos claros no identifican por sí solos un campo; cuando el borde sea necesario para distinguir el control usar control-border y comprobar el estado concreto. Error no solo rojo: incluir texto explicativo. La suspensión no equivale a error; mostrar etiqueta “Suspendida en esta institución”.

Contrastes calculados sobre colores opacos mediante luminancia sRGB:

| Par | Relación | Decisión |
| --- | --- | --- |
| Blanco / #28AD56 | 2,92:1 | No usar para texto, incluso grande, ni como única señal de control sobre blanco |
| #0F172A / #28AD56 | 6,12:1 | Texto oscuro sobre verde de marca |
| Blanco / #18529D | 7,68:1 | Adecuado para texto normal de acción |
| Blanco / #166534 | 7,13:1 | Adecuado para acción positiva |
| #475569 / blanco | 7,58:1 | Texto secundario |

El objetivo de contraste es 4,5:1 para texto normal y 3:1 para grande y controles pertinentes; validar cada estado/transparencia. Referencia: [WCAG 2.2, contraste](https://www.w3.org/TR/WCAG22/#contrast-minimum). Las medidas anteriores son cálculo local; no certificación del sitio.

## Tipografía, espacio y jerarquía

Reutilizar Segoe UI/Aptos/sans-serif de index.css; no descargar fuentes nuevas. Conservar inicialmente el root de 112,5% y medidas rem: 1rem equivale a 18px solo con preferencia predeterminada del navegador. Evaluar legibilidad con usuarios antes de cambiar globalmente esa escala.

| Uso | Escala propuesta |
| --- | --- |
| Cuerpo/control | 1rem, interlineado 1,5 |
| Ayuda/dato secundario | 0,875rem, interlineado 1,45; evitar el 0,6875rem actual para información necesaria |
| Título de página | 1,5–2rem, interlineado 1,2, peso 600 |
| Título de sección | 1,125–1,25rem, peso 600 |
| Espacios | 0,25 / 0,5 / 0,75 / 1 / 1,5 / 2 / 3rem |
| Radio | 0,5rem controles; 0,75–1rem paneles; píldora para etiquetas |
| Sombra | Discreta en paneles elevados; ninguna necesaria en cada tarjeta |

Un h1 propio de página; encabezado del layout no duplica el h1. Contenido alineado a un contenedor flexible, inicialmente max-w-6xl como layouts existentes. No introducir gráficos ni indicadores que no tengan datos verificables.

## Componentes y reutilización

| Familia | Base real | Propuesta y contrato de interacción |
| --- | --- | --- |
| Marca | Logo + SVG existentes | Alt útil si identifica aplicación; alt vacío cuando repite texto adyacente |
| Shell y navegación | AdminLayout, StudentLayout, TutorLayout, NavLink | Composición común de header/nav/main/footer manteniendo menús por rol; institución y rol siempre visibles |
| Button | Utilidades repetidas | Primario azul, secundario borde, positivo verde oscuro, peligro rojo; busy con texto y doble envío bloqueado |
| Field/Input/Select/Textarea | Inputs locales; AdminFilterSelect | ID único, label, ayuda/error vinculados, required consistente, aria-invalid, preservar dato tras fallo |
| Dialog/ConfirmDialog | Modales locales; ChangePasswordModal; ExcelImportHelp | Título, foco inicial/ciclo/restauración, Escape, fondo no interactivo; cerrar no simula reversión del servidor |
| Alert/ProcessStatus | alert/live existentes | Estado persistente relevante; errores de campo + resumen; mensaje útil sin SQL/token ni explicación JWT al usuario |
| Badge | StatusBadge/RoleBadge y STATUS_CHIP locales | Mapas separados de membresía, publicación, entrega, consulta docente y tutoría; texto además de color |
| Table/FilterBar/Pagination | Listas administrativas | Encabezados semánticos, caption, acción nombrada por fila, filtros del servidor, página base cero interna |
| Card/EmptyState/LoadingState/ErrorState | SummaryCard y estados locales | Componentes nuevos a derivar; datos desconocidos no se muestran como cero |
| ImportReport | ExcelImportHelp y reporte existente | Adaptar resultados V30: creados/invitados/omitidos/fallidos por registro; conservar ID de invitación sin prueba secreta |
| ExportActions | XLSX/jsPDF existentes | Exportar solo datos autorizados cargados, declarar alcance de página; no inferir exportación global |
| Conversation | StudentQuestions, TutorPendingPage, TutorHistoryPage | Reutilizar presentación, con adaptadores y estados independientes para consulta de materia/tutoría |
| AttachmentList | No existe | Nueva lista de Metadata; abrir URL solo tras petición autorizada; nunca un input de carga binaria |

Los nombres nuevos son orientativos y no obligan a crear biblioteca propia extensa. Extraer primero necesidades compartidas verificadas, preservando props/tests útiles.

## Estados y lenguaje

Para cada vista especificar carga inicial, actualización, éxito, vacío sin datos, vacío con filtros, validación, fallo de red, falta de acceso y conflicto concurrente. “No hay tareas” requiere una respuesta vacía correcta; “No pudimos cargar las tareas” ofrece reintento. Reintentar lectura es seguro; no repetir automáticamente una invitación, registro de referencia o entrega ante respuesta incierta.

| Dominio | Etiquetas de interfaz |
| --- | --- |
| Membresía | Activa / Suspendida / Revocada; cuenta global se consulta por separado |
| Publicación | Borrador / Publicado; no ofrecer publicar después si falta endpoint de actualización |
| Entrega | Pendiente (sin registro) / Borrador / Entregada a tiempo / Entregada tarde |
| Asistencia | Presente / Ausente / Retardo / Justificada |
| Consulta docente | Abierta / En seguimiento / Cerrada |
| Tutoría | Pendiente / Respondida / Corregida / Rechazada; mantener estados reales del contrato heredado |

Mostrar plazo absoluto con zona horaria y, si ayuda, referencia relativa. dateUtils usa es-MX pero actualmente la zona del dispositivo: adaptar explícitamente en fase de tareas. El servidor decide plazo/estado; el reloj del navegador solo orienta. Nunca anunciar “guardado” por iniciar una petición.

## Responsividad y accesibilidad

Diseñar desde 320px con una columna, controles principales visibles y formularios de una o dos columnas según espacio. Reutilizar breakpoints Tailwind existentes: sm 640, md 768, lg 1024, xl 1280px. Adoptar una navegación móvil coherente para todos los roles; tabla compleja puede desplazarse dentro de su región, con acciones nombradas accesibles. No esconder acciones esenciales detrás de hover. Drawer/modal usa viewport disponible y scroll propio; probar teclado virtual.

Objetivo táctil interno 44×44 CSS px; WCAG 2.2 AA establece 24×24 con excepciones de separación. Comprobar reflow a 320 CSS px, texto a 200%, teclado y foco no oculto por headers. Respetar prefers-reduced-motion, no imponer espera decorativa. OTP/password deben admitir pegar y gestores/autocomplete apropiados; revisar alternativas accesibles a reCAPTCHA sin cambiar autenticación. Referencia normativa: [WCAG 2.2](https://www.w3.org/TR/WCAG22/). Estas comprobaciones están pendientes de implementación y ensayo manual.

## Personalización futura por institución

No hay contrato actual de colores/logotipo institucional. Hasta que exista, usar TutorLink y nombre de institución autorizado, sin inventar endpoint de branding. Diseñar variables semánticas para recibir futuros valores; comprobar contraste contra surfaces/on-colors, hover, focus y estados. Si una combinación no pasa, aplicar azul/verde oscuro accesibles de TutorLink y explicar al administrador el ajuste cuando exista módulo autorizado. No recolorear warning/danger como marca.

Mantener nombre textual de escuela aunque el logo falle; reservar dimensiones y alt contextual. Validar procedencia/formato del activo en la futura integración, sin aprovechar adjuntos como almacenamiento de logos. La personalización es futura, no una opción de configuración disponible hoy.

## Ajustes de legibilidad y navegación del 18-10-2026

- Tablas existentes: padding vertical de 1 rem y horizontal de 1,125 rem; en móvil 0,875 rem. Encabezados sin corte y desplazamiento dentro de la región de tabla.
- Paginación compartida centrada: primera y última página, entorno de la página actual, puntos suspensivos, `aria-current=page` y formulario «Ir a página» para acceder directamente a cualquier índice. Los botones respetan el estado de carga.
- `Dialog` admite `wide` hasta 90 rem, siempre limitado al viewport. El detalle de grupos usa dos columnas a partir de 1280 px; cada lista tiene scroll propio de hasta 45dvh y cinco filas por página. Asignaciones de tutoría reutiliza el mismo diálogo accesible con paginación de estudiantes.
- El selector de rol se oculta cuando el usuario ya tiene DOCENTE y TUTOR o cuando tiene ESTUDIANTE. Los perfiles existentes siguen siendo editables.
- Periodos y cursos: «Ver detalles» abre el formulario editable conectado a PUT institucional. No se borra el formulario al fallar ni se anuncia éxito antes de la respuesta.

Los listados usan **10 registros por página** (usuarios institucionales, invitaciones, periodos, cursos, grupos, materias y consultas). Los modales de asignaciones y grupos conservan **5 registros por página**. Las exportaciones mantienen todos los resultados filtrados.

## Variante administrativa desktop-first — 18/10/2026

La apariencia ADMIN se delimita mediante `WorkspaceLayout appearance="admin"`, `.tl-admin` y un contexto exclusivamente visual para que los portales conserven la presentación. Ese contexto nunca decide roles ni institución. Los demás espacios conservan sus estilos; no cambia la escala raíz del navegador ni ThemeProvider.

- Fondo de trabajo `#F7F9FC`, navegación `#F1F4F9`, texto `#17243B`, secundario `#52627B`, borde `#DFE6EF`; azul institucional mediante el token vigente de acción. Marca verde original y acciones positivas oscuras conservadas.
- Sidebar 248 px en escritorio desde 1024 px, logo original y variante sidebar con fallback al isotipo existente. Estados activos con texto, borde y acento azul; iconos SVG discretos con etiquetas visibles. Las opciones se agrupan por función.
- Tokens centralizados para superficies, borde, radio (14 px), separación (24 px), altura mínima de control (44 px), sombra, tamaños de diálogo y capa modal. Mantener las reglas existentes de tipografía, foco y movimiento reducido.
- Tablas: padding 16×18 px en listados y 12×14 px en diálogos, encabezados asociados mediante `scope=col` y una región horizontal posicionada y accesible. La presentación administrativa no depende del padding global con `!important`.
- Contenido de listados hasta 1600 px; perfil propio hasta 1120 px. Encabezados y acciones admiten wrap; no se eliminan columnas, filtros, importaciones, exportaciones ni ayudas.
- Diálogos: confirmación 480 px; formulario 800 px; perfil 1120 px; gestión 1600 px. Márgenes horizontales de 32 px en escritorio, 16 px en tablet y 12 px en móvil. Adaptación por CSS/viewport, sin detección de sistema operativo.
- Un cuerpo con scroll vertical, con encabezado y pie fuera de él. Las tablas internas solo desplazan horizontalmente. Formularios distribuidos en dos columnas cuando hay espacio; grupos y asignaciones en dos secciones horizontales desde 1280 px. Listados de 10 filas y modales de 5, con índices y salto directo intactos.
- Dirty state solo en memoria: Escape, backdrop y controles de cierre piden confirmación de descarte si corresponde. «Seguir editando» conserva valores y foco. El cambio de perfil con borrador solicita una decisión explícita. No se persiste información entre instituciones ni se reintentan escrituras automáticamente.
- Durante una escritura se impide cerrar; el guardado exitoso sigue el flujo existente. En perfiles y catálogos se anuncia la confirmación. Las confirmaciones de acciones institucionales conservan su semántica y alcance.

Contraste sRGB calculado: texto/fondo 14.73:1; secundario/blanco 6.19:1; azul/selección suave 6.63:1; blanco/azul 7.68:1; blanco/verde oscuro 7.13:1. Esto verifica pares concretos, no una certificación WCAG completa.

## Homogeneización de controles e iconografía — 22/10/2026

La geometría de controles se comparte ahora entre autenticación, ADMIN, DOCENTE, TUTOR, ESTUDIANTE y SUPER_ADMIN, incluidos los portales y botones heredados. `--tl-button-radius: 8px` define esquinas suaves rectangulares para botones y campos; `--tl-button-target: 44px` establece la altura mínima. Los botones de icono tienen un área de 44×44 px. Las diferencias de color siguen expresando acción principal, secundaria o destructiva. Los badges de estado, avatares y spinners conservan su forma propia porque no son botones. La variante administrativa conserva sus superficies y distribución.

`ActionIcon` e `IconButton` centralizan SVG decorativos y nombres accesibles: ojo para detalles, papelera para quitar asignación, desvinculación para retirar inscripción, flecha circular para reenviar y cruz para cancelar invitación. La papelera de asignaciones elimina únicamente la relación: la ayuda contextual aclara que se conserva la cuenta y la confirmación existente sigue siendo obligatoria. No se sustituyen por iconos ambiguos los controles principales de crear, asignar, guardar, importar o confirmar. PDF y Excel conservan texto y añaden el mismo símbolo de descarga; la ayuda comparte el tamaño y radio de los demás controles.

Cada icono tiene nombre accesible y ayuda visible al pasar el cursor o recibir foco; la ayuda admite el paso del cursor sobre ella. Escape oculta primero la ayuda, sin cerrar el diálogo. Los estados pendientes/deshabilitados se conservan y las acciones de icono anuncian `aria-busy` sin cambiar de tamaño. No cambian llamadas API, permisos, paginación ni exportaciones.

Los diálogos limitan también el tamaño mínimo de la columna de su backdrop: el ancho intrínseco de una tabla no debe ensanchar el modal fuera del viewport. Las tablas conservan el desplazamiento horizontal dentro de su región. Las comprobaciones automatizadas de esta revisión no equivalen a una evaluación de usabilidad con personas ni a certificación WCAG.

Actualización de exportaciones: PDF usa icono de documento PDF sobre botón rojo; Excel usa documento con X sobre botón verde oscuro. Ambos muestran «Exportar» en blanco y conservan el formato en el nombre accesible. Se reutilizan las variantes compartidas `danger` y `positive`, el radio de 8 px y las operaciones existentes; el rojo aquí identifica el formato PDF, sin implicar eliminación.

## Apariencia compartida de espacios de trabajo — 22/10/2026

Ampliación posterior: el usuario con DOCENTE+TUTOR usa un único menú y resumen, con secciones diferenciadas de docencia y tutorías; se retira el selector entre esos roles. «Ver actividades» ahora incluye formulario de alta/edición, eliminación confirmada y revisión de entregas, reutilizando un solo `Dialog` de gestión. Los errores recuperables conservan el formulario; los mensajes de escritura reciben foco y desplazamiento para permanecer visibles. Las confirmaciones son secciones del mismo diálogo, sin ventanas anidadas. Ver [detalle actualizado](DOCENCIA_TUTORIAS_ACTIVIDADES.md); las notas de consulta limitada que siguen describen el incremento anterior.

La presentación clara que antes se limitaba a ADMIN es ahora la predeterminada de `WorkspaceLayout`: fondo neutral, sidebar de 248 px, grupos de navegación con iconos, cabecera, tarjetas, tablas, formularios y diálogos compartidos. Se aplica a ADMIN, DOCENTE, TUTOR, ESTUDIANTE y los dos contextos de SUPER_ADMIN. La clase histórica `tl-admin` y `AdminPresentationContext` se conservan por compatibilidad como recursos exclusivamente visuales: no conceden permisos. Los portales de `Dialog` reciben la misma presentación desde el shell. Autenticación conserva su superficie específica y sus tokens compartidos.

Los menús mantienen destinos y roles independientes: TUTOR presenta sus consultas y DOCENTE sus materias. La identidad y el cierre permanecen al pie; el cambio de institución sigue exclusivamente en Mi perfil. Los dashboards de tutor y estudiante reutilizan las tarjetas y acciones del sistema, sin un segundo ancho máximo dentro del contenido fluido.

DOCENTE: «Mis materias» permite abrir «Ver actividades» por grupo, con tareas y clases/materiales, búsqueda, publicación/borrador, instrucciones, fecha límite y admisión de tardías según el registro real. El diálogo usa cinco registros por página, estados carga/vacío/error, reintento de lectura y descarte de respuestas de consultas anteriores. El inicio docente enlaza a ese listado. No se ofrecen creación/edición, entregas, calificaciones, asistencia ni descargas en esta ampliación de consulta. Los diálogos de conversación heredados conservan su implementación local; el rediseño común de `Dialog` no implica su migración automática.
