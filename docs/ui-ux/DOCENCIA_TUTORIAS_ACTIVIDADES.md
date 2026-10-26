# Docencia, tutorías y actividades — 22/10/2026

## Espacio de trabajo conjunto

Cuando el contexto autenticado contiene **DOCENTE y TUTOR**, ambos se presentan en un único espacio «Docencia y tutorías». El inicio es `/teacher` y el menú incluye resumen general, materias/actividades, preguntas pendientes, historial y perfil. El acceso heredado `/tutor` redirige al resumen conjunto. Se conservan las rutas de tutorías y sus formularios. El perfil común conserva el acceso al perfil del tutor y al cambio institucional.

No se inventa un rol combinado ni se modifica el JWT: cada API continúa exigiendo su membresía, perfil y relaciones correspondientes. Navegar entre `/teacher/**` y `/tutor/**` con ambos roles no cambia el rol visual almacenado ni emite otro token. El perfil elimina el selector entre estos dos roles; si existen otros espacios autorizados, el selector mantiene esas alternativas y agrupa docencia/tutorías. Una persona con solo TUTOR conserva su dashboard de tutor y no accede a docencia; solo DOCENTE conserva únicamente docencia. Cambiar de institución sigue sustituyendo el contexto y desmontando el contenido anterior.

El resumen docente usa los totales reales de grupos asignados, tareas consultables y consultas docentes abiertas. Las tareas incluyen borradores propios y publicados autorizados; no se presentan como pendientes del día. Las cifras de tutorías mantienen sus endpoints existentes. Una consulta fallida muestra indisponibilidad y reintento, no un cero inventado.

## Gestión de actividades

En **Mis materias y actividades → Ver actividades**, el docente puede:

- Crear tareas o clases/materiales como borrador o publicación.
- Editar sus actividades mientras conserve asignación al grupo y membresía vigente.
- Consultar actividades publicadas de otros docentes asignados, sin editarlas ni eliminarlas.
- Eliminar sus actividades **solo cuando no tengan entregas —incluidos borradores— ni referencias de adjuntos, incluso desvinculadas**. Se requiere confirmación; el backend devuelve 409 si existe historial dependiente.
- Consultar estudiantes y entregas finales de una tarea mediante búsqueda, estado y paginación.

Los formularios conservan datos ante errores, confirman descarte y bloquean cierres durante escrituras. Título máximo 200 caracteres; cuerpo/instrucciones máximo 20000. Las tareas requieren fecha y hora límite, convertidas del dispositivo a una fecha con zona horaria; permiten configurar tardías. No se puede cambiar grupo ni autor mediante edición. No se puede despublicar una tarea con entregas o borradores. Las ediciones no recalculan estados históricos ON_TIME/LATE.

Las escrituras bloquean la actividad padre, comprueban institución, autoría y asignación, y guardan auditoría en la misma transacción. Un fallo de auditoría revierte la escritura. La eliminación física solo alcanza actividades sin dependencias; no elimina archivos externos ni entregas. No se modificaron migraciones ni tablas. El archivado de actividades con historial queda fuera de esta implementación.

## Revisión de entregas

La lista incluye únicamente estudiantes con inscripción, cuenta y membresía vigentes. Estados visibles: pendiente, a tiempo y tardía. Un borrador se presenta como **pendiente**, sin ID de entrega, texto, fecha ni adjuntos del borrador. Se pueden expandir entregas finales para leer su texto y consultar referencias registradas de archivos.

Los archivos se consultan mediante la API central de adjuntos, con `actingRole=DOCENTE`. Primero se obtienen metadatos; la URL solo aparece tras autorización explícita de contenido y validación del catálogo institucional. Un 409 conserva los metadatos y no expone la URL. El listado de referencias no ofrece total: sus controles anterior/siguiente no inventan un recuento global.

Esta vista no sube archivos, no incorpora almacenamiento ni Cloudinary y no implementa calificaciones. Las entregas se realizan mediante el contrato estudiantil existente; la nueva pantalla es de gestión y revisión docente.

## Verificación

Las pruebas backend incluyen creación/edición/eliminación, autor distinto, falta de asignación, membresía suspendida, mismo usuario en otra institución, límites de entrada, historial dependiente, borradores privados y rollback de auditoría. Las pruebas frontend cubren formulario conservado ante 409, descarte, confirmación, alumnos/estados, referencias autorizadas y navegación conjunta sin cambios de JWT.

El orquestador real existente se intentó y abortó antes de iniciar recursos porque **5173 y 8080 estaban ocupados (EADDRINUSE)**. No se detuvieron esos procesos ni se usó su base. La spec `academic.real.cy.js` incorpora un recorrido nuevo sin interceptores para CRUD y entrega sintética mediante la API estudiantil; su ejecución completa React–Spring Boot–PostgreSQL queda pendiente hasta liberar ambos puertos y ejecutar `scripts/e2e/run-real-admin-cypress.sh`. Las pruebas HTTP PostgreSQL con Testcontainers se ejecutan independientemente de ese bloqueo.

Resultados finales: backend **308/308** (incluye H2 **28/28** y PostgreSQL **28/28**, sin omisiones); Vitest **126/126**; Cypress con contratos simulados **52/52**; ESLint y build Vite aprobados. Build conserva advertencias previas de tamaño de bundle y Browserslist. Evidencia visual local: `frontend/cypress/screenshots/context.cy.js/resumen-docencia-tutorias.png`; videos en `frontend/cypress/videos/`. Las pruebas simuladas no acreditan una sesión real de navegador contra Spring Boot. No se realizaron pruebas moderadas con participantes ni una auditoría WCAG completa.
