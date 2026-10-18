# Navegación, perfil y sesión — ajustes implementados

Fecha: 13 de octubre de 2026. Cambios exclusivos del frontend; no se modifican APIs, JWT, permisos ni migraciones. Se reutilizan AuthContext, InstitutionSwitch, ConfirmDialog, Logo, perfiles y guardias existentes.

## Organización y rutas

`WorkspaceLayout` concentra la estructura de AdminLayout, StudentLayout y TutorLayout. ContextLayout la utiliza para DOCENTE y SUPER_ADMIN. La cabecera muestra el título del espacio, el acceso al menú móvil y estados de actualización; no contiene identidad, selector institucional ni cierre de sesión.

El sidebar usa Flexbox, navegación desplazable y bloque final `margin-top: auto`. Su pie contiene nombre, correo principal truncado (texto completo accesible y en title), institución activa y rol visual. El bloque enlaza a Mi perfil. Un separador precede al botón Cerrar sesión, con icono, texto, hover y foco visible. No hay un segundo botón de salida en la cabecera.

| Espacio | Mi perfil | Datos disponibles |
| --- | --- | --- |
| ADMIN | `/admin/profile` | Perfil existente, contraseña y contexto |
| ESTUDIANTE | `/student/info` | Información existente y contraseña; navegación titulada Mi perfil, ruta conservada |
| TUTOR | `/tutor/profile` | Perfil existente, contraseña y contexto |
| DOCENTE | `/teacher/profile` | Datos de sesión y contexto en lectura |
| SUPER_ADMIN institucional | `/context/profile` | Datos de sesión y contexto en lectura |
| SUPER_ADMIN global | `/platform/profile` | Datos de sesión, membresías consultadas y catálogo administrable claramente diferenciado |

DOCENTE y SUPER_ADMIN no tenían una ruta propia de perfil. Las nuevas superficies reutilizan únicamente la identidad autenticada y el contexto existente. La edición personal permanece pendiente; no se inventan atributos académicos ni endpoints de perfil.

## Instituciones y contexto de trabajo

La sección compartida `ProfileContextSection` muestra institución activa, membresías y sus roles disponibles, selector institucional, roles del contexto y cambio de espacio cuando existen varios. La selección institucional sigue pasando por InstitutionSwitch y la confirmación existente. Cancelar mantiene contexto y foco; confirmar espera escrituras iniciadas, bloquea nuevas escrituras, solicita POST `/api/auth/context` y publica el JWT confirmado conjuntamente con sus roles. Se conservan generación de peticiones, descarte de respuestas antiguas y remontaje de datos privados.

ContextStatus mantiene GET `/api/auth/institutions` y las comprobaciones existentes activas en los espacios, independientemente de visitar Mi perfil. Actualizar instituciones permite recuperar opciones después de un error. Cambiar rol visual no emite JWT ni concede permisos; DOCENTE y TUTOR siguen separados.

En plataforma, GET `/api/platform/institutions` mantiene el catálogo real autorizado. Mi perfil consulta también GET `/api/auth/institutions` para identificar membresías propias; el catálogo no se presenta como afiliación académica. Tras recarga de SUPER_ADMIN institucional se conserva la limitación existente: recuperar catálogo global requiere Volver a plataforma y reautenticarse. No se guarda un segundo JWT ni se envía una institución nula.

## Responsive y accesibilidad

A partir de 1024px el sidebar permanece visible, con altura de viewport y navegación desplazable. En tamaños menores se abre desde Abrir menú. El menú móvil utiliza diálogo modal, fondo inert, foco inicial en Cerrar menú, ciclo Tab/Shift+Tab, cierre con Escape o fondo y restauración de foco. Se cierra al navegar o cambiar al breakpoint de escritorio. La salida está disponible dentro del menú en móvil y tableta.

El enlace Saltar al contenido enfoca el main. Los botones del menú tienen un mínimo de 44px; los enlaces y botones del sidebar usan foco blanco visible sobre azul `#18529D`. El correo largo y el texto institucional no desbordan el menú. Se mantienen superficies neutrales y los tokens documentados.

## Aplicación de las diez heurísticas

| Heurística | Aplicación y criterio de aceptación |
| --- | --- |
| H1 Estado visible | Institución/rol siempre identificables en el menú; procesos anunciados y actualización después de contexto confirmado |
| H2 Lenguaje del usuario | Mi perfil, Instituciones y contexto de trabajo, Cerrar sesión; sin JWT en mensajes de producto |
| H3 Control y libertad | Cancelación de cambios; cierre móvil con Escape y foco restaurado |
| H4 Consistencia | Misma estructura, controles y salida para los cinco perfiles; mismas capacidades en móvil |
| H5 Prevención de errores | Confirmación del descarte de formularios y comportamiento transaccional existente; sin IDs introducidos manualmente |
| H6 Reconocimiento | Nombre, institución y rol visibles; membresías y roles nombrados en Mi perfil |
| H7 Eficiencia | Pie de sesión enlaza directamente a Mi perfil; enlace para saltar al contenido |
| H8 Minimalismo | Se eliminan duplicados de identidad y salida de la cabecera; controles de contexto agrupados |
| H9 Recuperación | Fallo de cambio conserva contexto y muestra reintento; errores de actualización son recuperables |
| H10 Ayuda | Explicación de formularios descartados, acceso de plataforma y limitaciones de edición |

## Verificación y límites

Resultados efectivos:

- `npm test`: **84 pruebas aprobadas en 16 archivos**, sin fallos ni omisiones. Incluye 11 casos nuevos de sidebar/perfil y conserva 18 casos de transacciones de contexto: bloqueo/espera de escrituras, respuestas antiguas, roles revocados y preservación ante fallos.
- Cypress/Electron: **27 pruebas aprobadas en 7 specs**, sin fallos ni omisiones. Incluye 12 casos del sidebar: los seis ámbitos de rol (SUPER_ADMIN global e institucional separados), perfiles heredados con correo largo a 375px, menú a 375/768px y orientación horizontal 812×375. Los recorridos de contexto comprueban cambios desde Mi perfil, cambio fallido, DOCENTE/TUTOR y retorno de SUPER_ADMIN por reautenticación.
- `npm run lint`: correcto, sin errores. `npm run build`: correcto. Persiste el aviso anterior sobre un bundle mayor de 500kB; no se modifica la estrategia de carga en este alcance.
- Teclado: ciclo Tab/Shift+Tab y Escape comprobados con Testing Library; Escape y restauración del foco también en navegador. Fondo inert, limpieza del bloqueo y salida móvil comprobados. Correo largo sin desbordamiento de perfiles y pie anclado comprobados en navegador. Capturas de escritorio y móvil inspeccionadas; la captura de escritorio de Cypress puede recortar su viewport ampliado y no sustituye las aserciones de anchura del documento.
- `git diff --check`: correcto. `graphify update .`: correcto; grafo de código actualizado. El extractor SQL opcional sigue ausente (`tree_sitter_sql`); no bloquea la actualización del grafo React.

Se adaptaron recorridos que aún buscaban controles en la cabecera o en navegación visible de escritorio. La prueba heredada de respuesta de tutor espera las dos lecturas de conversación producidas al sincronizar su URL, antes de escribir; no se deshabilitan pruebas ni se alteran los módulos de tutoría.

 Las pruebas de navegador interceptan HTTP y reCAPTCHA de pruebas; no equivalen a integración real con Spring. No hay backend disponible en localhost:8080 para un recorrido integrado. No se afirma conformidad completa WCAG: quedan evaluación con lector de pantalla y revisión integral de zoom/accesibilidad fuera de estas comprobaciones.

## Archivos de esta modificación

- Estructura: `frontend/src/App.jsx`, `frontend/src/layout/{AdminLayout,StudentLayout,TutorLayout,ContextLayout,WorkspaceLayout}.jsx`.
- Controles: `frontend/src/components/context/{ProfileContextSection,ContextStatus,InstitutionSwitch}.jsx`. ProfileContextSection reemplaza ContextBar; las funciones de sesión siguen en los servicios existentes.
- Perfiles: `frontend/src/pages/admin/AdminProfilePage.jsx`, `frontend/src/pages/student/StudentInfoPage.jsx`, `frontend/src/pages/tutor/TutorProfilePage.jsx` y `frontend/src/pages/context/ContextProfilePage.jsx`. Se ajustan los landmarks de ContextPage y PlatformAccessPage al layout compartido.
- Pruebas: `frontend/src/layout/__tests__/WorkspaceLayout.test.jsx`, los recorridos de WorkspaceNavigation/ContextTransactions y la sincronización en TutorPendingPage.test.jsx; Cypress `context.cy.js`, `auth.cy.js`, `tutor.cy.js` y nuevo `sidebar.cy.js`.
- Documentación: este archivo, AUTENTICACION_CONTEXTO.md, NAVEGACION_POR_ROLES.md y docs/CONTRATO_API_CURSOS.md. Graphify actualiza sus artefactos locales.
