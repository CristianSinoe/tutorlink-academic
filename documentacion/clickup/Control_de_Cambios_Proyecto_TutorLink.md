# Control de Cambios – Proyecto TutorLink

## 1. Datos generales

- Proyecto: TutorLink
- Responsable del control de cambios: Cristian Sinoe Hernández Ruiz
- Equipo:
  - Cristian Sinoe Hernández Ruiz – Project Manager / Backend / Coordinación técnica
  - Benjamin Emmanuel Coello Trujillo – Frontend
  - Yatana Roa – QA / Product Owner académico / validación del negocio
- Herramienta de gestión: ClickUp
- Repositorio: https://github.com/CristianSinoe/tutorlink-academic.git
- Periodo del proyecto: del 2026-03-23 al 2026-05-23
- Versión del documento: 1.0
- Fecha de elaboración: 2026-05-23
- Estado del documento: Borrador controlado preparado para carga en ClickUp

## 2. Propósito del control de cambios

Este documento tiene como finalidad registrar, evaluar, aprobar y dar seguimiento a los cambios realizados o solicitados durante el proyecto TutorLink, permitiendo mantener trazabilidad sobre modificaciones al alcance, cronograma, requerimientos, calidad, recursos, documentación, arquitectura y componentes técnicos del sistema.

## 3. Alcance del control de cambios

Aplica a:

- Cambios de alcance.
- Cambios de cronograma.
- Cambios en EDT/WBS.
- Cambios en requerimientos.
- Cambios en entregables.
- Cambios técnicos.
- Cambios de calidad/testing.
- Cambios de recursos.
- Cambios de documentación.
- Cambios de seguridad.
- Cambios de arquitectura.
- Cambios de base de datos.
- Cambios de despliegue o entorno.

## 4. Criterios de registro PMBOK

Cada control de cambio debe contener obligatoriamente:

### Identificación general

- Número de control de cambio.
- Fecha de realización.
- Solicitante del cambio.

### Clasificación del cambio

- Categoría del cambio:
  - Cronograma
  - Costo
  - Alcance
  - Requerimientos/Entregables
  - Testing/Calidad
  - Recursos
  - Documentación
  - Arquitectura
  - Base de datos
  - Seguridad
  - DevOps/Entorno
  - Gestión del proyecto
- Tipo de implicación:
  - Acción correctiva
  - Acción preventiva
  - Defecto de reparación
  - Actualización
  - Otro

### Detalle de la solicitud

- Descripción del cambio solicitado.
- Justificación o motivo.
- Alternativas consideradas.
- Alternativa de operación si el cambio no se implementa.

### Evaluación de impactos

- Cambios técnicos requeridos.
- Riesgos considerados por implementar el cambio.
- Riesgos de NO aprobar el cambio.
- Estimación de recursos.
- Estimación de costos.
- Personal requerido.
- Implicancias en calidad.
- Impacto en cronograma.
- Impacto en costo.
- Impacto en alcance.
- Fechas estimadas de implementación.
- Impacto general.

### Resolución final

- Decisión del Project Manager o comité:
  - Aprobar
  - Rechazar
  - Posponer
- Justificación de la decisión.
- Responsable autorizante.
- Nombre.
- Firma.
- Fecha de autorización.

## 5. Consideraciones metodológicas y de evidencia

- No se localizaron archivos formales dedicados de cronograma ni de EDT/WBS dentro del repositorio. Por ello, los cambios asociados a dichos artefactos se reconstruyeron desde el Acta de Constitución, Alcance, SRS, Plan de Pruebas, ramas Git, releases y estado técnico actual.
- Los cambios de marzo y abril de 2026 son principalmente documentales o inferidos por evidencia académica; los cambios del 14 al 18 de mayo de 2026 cuentan con respaldo directo en commits y diffs del repositorio.
- El repositorio presenta trabajo no liberado en el árbol actual, especialmente sobre hilo conversacional, revisiones de mensajes, reenvío de OTP y ajustes de frontend. Dichos elementos se registran como cambios en curso o reconstruidos desde el estado actual.

## 6. Matriz general de cambios

| ID | Fecha | Solicitante | Categoría | Tipo de implicación | Área afectada | Descripción del cambio | Justificación | Alternativas consideradas | Cambios técnicos requeridos | Riesgos por implementar | Riesgos de no aprobar | Recursos/costos estimados | Implicancias en calidad | Impacto en cronograma/costo/alcance | Fecha estimada de implementación | Decisión | Justificación de la decisión | Responsable | Estado | Evidencia/referencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CC-001 | 2026-03-23 | PM | EDT/WBS / Alcance / Gestión | Actualización | Gestión | Reestructuración del EDT/WBS por grupos PMBOK | Ordenar entregables y trazabilidad | Mantener estructura implícita | Reorganización documental | Sobredocumentación | Pérdida de trazabilidad | Bajo | Mejora control formal | Bajo / Bajo / Medio | 2026-03-23 | Aprobado | Coherente con revisión académica | Cristian Sinoe Hernández Ruiz | Implementado | Cambio inferido por `Documentacion/01`, `05`, `06`, `13` |
| CC-002 | 2026-03-30 | PM | Alcance / EDT/WBS / Documentación | Actualización | Gestión / Diseño | Inclusión de fase de diseño en ejecución | Separar diseño de construcción | Mezclar diseño con desarrollo | Diagramas, arquitectura, BD y mockups | Mayor esfuerzo documental | Decisiones dispersas | Bajo | Mejora mantenibilidad y defensa técnica | Bajo / Bajo / Medio | 2026-04-06 | Aprobado | El proyecto ya cuenta con artefactos de diseño | Cristian / Benjamin | Implementado | `docs/arquitectura-tutorlink.puml`, `docs/base-datos-tutorlink.puml`, `docs/patrones-diseno-tutorlink.md` |
| CC-003 | 2026-03-30 | PM | Cronograma | Acción correctiva | Gestión | Ajuste lógico del cronograma para precedencia análisis-planeación-diseño-desarrollo-pruebas | Mantener coherencia PMBOK | Continuar sin secuencia formal | Reordenar hitos semanales | Reprogramación menor | Solapes inconsistentes | Bajo | Mejora secuencia de validación | Medio / Bajo / Bajo | 2026-04-01 | Aprobado | Necesario por consistencia académica | Cristian Sinoe Hernández Ruiz | Implementado | Cambio inferido por fechas documentales y secuencia de entregables |
| CC-004 | 2026-03-30 | PM | Recursos / Gestión | Actualización | Equipo | Asignación y actualización de responsables sin alterar dueños ya definidos | Mejorar seguimiento | Responsabilidad compartida difusa | Normalizar responsables por área | Cuellos de botella si se concentra | Baja rendición de cuentas | Bajo | Mejora gobernanza | Bajo / Bajo / Bajo | 2026-03-30 | Aprobado | El equipo ya muestra separación por áreas | Cristian / Benjamin / Yatana | Implementado | Contexto del proyecto y ramas `sinoe`, `benjamin` |
| CC-005 | 2026-05-23 | PM | Gestión / Documentación | Acción preventiva | Gestión | Incorporación del control de cambios formal | Evitar pérdida de trazabilidad | Seguimiento informal | Documento central y fichas | Mayor carga documental | Falta de evidencia ante revisión | Bajo | Mejora auditoría del proyecto | Bajo / Bajo / Bajo | 2026-05-23 | Aprobado | Requerido para cierre documental | Cristian Sinoe Hernández Ruiz | Implementado | Archivo actual |
| CC-006 | 2026-05-23 | PM | Documentación / Gestión | Acción preventiva | Gestión | Creación de actas semanales de inicio de semana | Registrar acuerdos, avances y riesgos | Comentarios dispersos | Actas por semana con compromisos | Consumo de tiempo documental | Debilidad de seguimiento | Bajo | Mejora control semanal | Bajo / Bajo / Bajo | 2026-05-23 | Aprobado | Aporta evidencia de seguimiento Scrum/PMBOK | Cristian Sinoe Hernández Ruiz | Implementado | Carpeta `documentacion/clickup/actas/` |
| CC-007 | 2026-04-06 | PM | Arquitectura / Documentación | Actualización | Arquitectura | Documentación de arquitectura del sistema | Justificar separación FE/BE/DB | Descripción textual sin diagrama | PlantUML C4/arquitectura | Desactualización si cambia rápido | Baja comprensión técnica | Bajo | Mejora comunicación y mantenimiento | Bajo / Bajo / Medio | 2026-05-18 | Aprobado | Existe evidencia concreta | Cristian Sinoe Hernández Ruiz | Implementado | `docs/arquitectura-tutorlink.puml`, SRS secciones de arquitectura |
| CC-008 | 2026-04-06 | PM | Base de datos / Documentación | Actualización | Base de datos | Creación/actualización del diagrama de base de datos | Claridad de relaciones y entidades | Solo migraciones SQL | Diagrama ER y modelo lógico | Desfase con migraciones futuras | Cambios de datos menos controlados | Bajo | Mejora integridad documental | Bajo / Bajo / Medio | 2026-05-18 | Aprobado | Sustenta persistencia y futuras modificaciones | Cristian Sinoe Hernández Ruiz | Implementado | `docs/base-datos-tutorlink.puml`, SRS modelo ER |
| CC-009 | 2026-04-13 | PM | Arquitectura / Documentación / Calidad | Actualización | Arquitectura | Documentación de patrones de diseño utilizados | Evidenciar buenas prácticas | Omitir patrones | Documento Markdown dedicado | Simplificación excesiva | Menor defensa técnica | Bajo | Mejora comprensión del diseño | Bajo / Bajo / Bajo | 2026-05-18 | Aprobado | Artefacto útil para revisión académica | Cristian Sinoe Hernández Ruiz | Implementado | `docs/patrones-diseno-tutorlink.md` |
| CC-010 | 2026-05-15 | PM | Testing/Calidad | Acción preventiva | Calidad backend | Incorporación de análisis estático con SonarQube | Detectar deuda técnica y smells | Revisión manual tradicional | Generar reportes y revisar hallazgos | Falsos positivos y tiempo extra | Issues críticos no detectados | Bajo | Mejora mantenibilidad | Bajo / Bajo / Bajo | 2026-05-15 | Aprobado | Hay evidencia de ejecuciones reales | Cristian Sinoe Hernández Ruiz | Implementado | `backend/sonar-issues_V1..V5.json`, commit `2d52e68` |
| CC-011 | 2026-05-18 | PM | Testing/Calidad / Backend | Defecto de reparación | Backend | Corrección progresiva de issues SonarQube | Reducir smells y deuda técnica | Posponer limpieza | Refactor en `QaService`, `AdminUserService`, `SecurityConfig` | Regresiones por refactor | Deuda técnica acumulada | Bajo-medio | Mejora calidad interna | Bajo / Bajo / Bajo | 2026-05-18 | Aprobado | Parte de la deuda sigue abierta | Cristian Sinoe Hernández Ruiz | En evaluación | `backend/sonar-issues_V4.json`, `V5.json` |
| CC-012 | 2026-05-15 | Frontend | Testing/Calidad / Frontend | Acción preventiva | Frontend | Evaluación del frontend con ESLint y propuesta de E2E/Cypress | Extender control de calidad al frontend | Solo revisión visual | Lint, build y eventual E2E | Retraso por corrección UI | Errores de integración no detectados | Bajo | Mejora confiabilidad visual | Bajo / Bajo / Bajo | 2026-05-23 | Aprobado | ESLint existe, Cypress solo propuesto | Benjamin Emmanuel Coello Trujillo | Implementado parcial | `frontend/eslint.config.js`, `package.json`, `Documentacion/13` |
| CC-013 | 2026-04-13 | QA / PM | Testing/Calidad | Actualización | QA | Ampliación del plan de pruebas | Cubrir niveles unitario, integración, sistema y E2E | Mantener pruebas ad hoc | Elaborar plan integral | Más esfuerzo de QA | Cobertura incompleta | Bajo | Mejora estrategia de validación | Medio / Bajo / Bajo | 2026-04-13 | Aprobado | Existe plan de pruebas detallado | Yatana / Cristian / Benjamin | Implementado parcial | `Documentacion/13_Plan_Pruebas.md` |
| CC-014 | 2026-04-13 | QA | Testing/Calidad / Documentación | Actualización | QA / Negocio | Documentación de pruebas funcionales por rol | Evidenciar cumplimiento funcional | Probar sin registrar | Casos por rol y evidencia | Omisiones documentales | Menor defensa académica | Bajo | Mejora trazabilidad funcional | Bajo / Bajo / Bajo | 2026-04-13 | Aprobado | Plan documenta cobertura requerida | Yatana Roa | En evaluación | `Documentacion/13_Plan_Pruebas.md` |
| CC-015 | 2026-05-14 | PM | Seguridad / Backend | Acción preventiva | Seguridad | Ajuste y documentación de autenticación/autorización | Proteger información académica | Seguridad mínima | JWT, roles, hashing, OTP, reCAPTCHA | Mayor complejidad de acceso | Exposición de accesos | Medio | Seguridad reforzada | Bajo / Bajo / Medio | 2026-05-15 | Aprobado | Es núcleo del sistema | Cristian Sinoe Hernández Ruiz | Implementado | commits `1c0559a`, `bc15b81`, `effeb8d`; `SecurityConfig`, `AuthController` |
| CC-016 | 2026-05-15 | PM | Seguridad / Backend / Gestión | Acción correctiva | Backend admin | Recuperación/configuración de administrador inicial | Permitir acceso administrativo controlado | Manipulación directa de BD | Bootstrap y seed admin por entorno | Riesgo si se habilita en prod | Bloqueo administrativo | Bajo | Facilita validación y soporte | Bajo / Bajo / Bajo | 2026-05-15 | Aprobado | Existe con restricciones explícitas | Cristian Sinoe Hernández Ruiz | Implementado | commit `fa76386`, `AdminSeedRunner`, `InternalBootstrapController` |
| CC-017 | 2026-05-17 | PM | DevOps / Seguridad / Testing | Acción preventiva | Entorno | Separación de ambientes y BD de pruebas | Evitar contaminar datos | Usar una sola BD | `.env.demo`, `.env.docker`, DB `tutorlink_test` | Configuración inconsistente | Datos de prueba mezclados | Bajo | Mejora control de pruebas | Bajo / Bajo / Bajo | 2026-05-17 | Aprobado | Visible en configuración | Cristian Sinoe Hernández Ruiz | Implementado parcial | `backend/.env.demo`, `docker-compose.yml`, `application-demo.yml` |
| CC-018 | 2026-05-15 | PM / Frontend | DevOps/Entorno | Actualización | Dev local / LAN | Dockerización y ejecución en red local | Facilitar demos y pruebas presenciales | Setup manual separado | Dockerfiles, compose, exposición LAN | Configuración de red insegura si se amplía | Dificultad para demostrar sistema | Bajo | Mejora despliegue local | Bajo / Bajo / Bajo | 2026-05-15 | Aprobado | Evidencia directa en repo | Cristian / Benjamin | Implementado | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `README.md` |
| CC-019 | 2026-05-15 | PM / Frontend | DevOps / Seguridad / FE / BE | Acción correctiva | Integración | Ajuste de CORS y configuración dinámica de API | Evitar fallos de conexión en LAN | URLs fijas por ambiente | `allowed-origin-patterns`, `resolveApiBaseUrl` | Riesgo de apertura excesiva en dev | Fallas de integración FE/BE | Bajo | Mejora interoperabilidad local | Bajo / Bajo / Bajo | 2026-05-15 | Aprobado | Implementación observable | Cristian / Benjamin | Implementado | `README.md`, `application.yml`, `SecurityConfig.java`, `resolveApiBaseUrl.js` |
| CC-020 | 2026-05-15 | PM | Gestión / DevOps | Actualización | Repositorio | Control de versiones y ramas main/release/develop/por responsable | Trazabilidad de integración | Trabajo directo en main | Modelo de ramas y merges | Conflictos de integración | Historial menos gobernable | Bajo | Mejora control de entregas | Bajo / Bajo / Bajo | 2026-05-15 | Aprobado | Git lo evidencia claramente | Cristian Sinoe Hernández Ruiz | Implementado | ramas Git y merges `abc6077`, `f2480be`, `12d5f01` |
| CC-021 | 2026-05-14 | PM | Alcance / Backend / BD / Calidad | Actualización | Tutorías | Inclusión de historial y versionado de respuestas | Mantener trazabilidad tutorial | Sobrescribir respuesta actual | Campo `version`, `current_answer`, historial | Mayor complejidad de modelo | Pérdida de trazabilidad | Bajo | Mejora auditoría académica | Bajo / Bajo / Medio | 2026-05-15 | Aprobado | Parte ya está implementada | Cristian Sinoe Hernández Ruiz | Implementado parcial | migraciones `V2`, `V3`, `V9`; `Answer.version`; tests `QaServiceTest` |
| CC-022 | 2026-05-18 | PM / Frontend | Alcance / Requerimientos | Otro | Producto | Evaluación de funcionalidad tipo chat/hilo | Mejorar continuidad del seguimiento académico | Mantener esquema pregunta-respuesta simple | Nuevo modelo conversacional | Ampliación de alcance | Menor continuidad académica | Medio | Aumenta alcance | Medio / Bajo / Alto | 2026-05-18 | Pospuesto | No aparece aprobado en documentación base | Cristian / Benjamin | Pospuesto | Propuesta inferida; ver también CC-031 en curso |
| CC-023 | 2026-05-18 | PM / Frontend | Alcance / Seguridad | Actualización propuesta | Producto | Evaluación de envío de enlaces y archivos | Enriquecer soporte tutorial | Texto simple | Validación de adjuntos y almacenamiento | Riesgos de malware y carga | Comunicación limitada | Medio | Alto impacto de seguridad | Medio / Medio / Alto | No definida | Pospuesto | Sin evidencia implementada | Cristian / Benjamin | Pospuesto | No se localizaron archivos ni endpoints de adjuntos |
| CC-024 | 2026-04-13 | PM | Documentación / Alcance | Actualización | Documentación final | Actualización de limitaciones y trabajo futuro | Delimitar alcance real | Omisión de restricciones | Sección de restricciones y roadmap | Percepción negativa si se explicita mal | Expectativas irreales | Bajo | Mejora transparencia | Bajo / Bajo / Bajo | 2026-04-13 | Aprobado | Necesario para cierre honesto | Cristian Sinoe Hernández Ruiz | Implementado | `Documentacion/01`, `05`, `13`, `backend/README.md` |
| CC-025 | 2026-05-23 | PM | Gestión / Documentación | Actualización | ClickUp | Migración o preparación documental hacia ClickUp | Centralizar evidencia | Mantener documentación local aislada | Generar Markdown y estructura de carga | Duplicidad documental | Evidencia dispersa | Bajo | Mejora presentación y consulta | Bajo / Bajo / Bajo | 2026-05-23 | Aprobado | Resuelve dependencia operativa actual | Cristian Sinoe Hernández Ruiz | Implementado | Carpeta `documentacion/clickup/` |
| CC-026 | 2026-05-14 | PM / Backend | Backend / Arquitectura / BD | Actualización | Backend | Implementación base del backend REST y capa de persistencia | Construir núcleo funcional | Prototipo sin API | Entidades, repositorios, servicios, DTOs, controladores | Regresiones tempranas | No habría producto funcional | Medio | Base sobre la que se apoya el resto | Medio / Medio / Alto | 2026-05-15 | Aprobado | Evidencia fuerte en commits fundacionales | Cristian Sinoe Hernández Ruiz | Implementado | commits `cdece70`, `effeb8d`, `4df57ea`, `bc15b81` |
| CC-027 | 2026-05-15 | PM / Backend | Backend / Admin / Calidad | Actualización | Administración | Importación CSV y asignaciones tutor-estudiante | Reducir carga manual y asegurar consistencia | Altas manuales una por una | Servicios admin, CSVs de prueba, reglas de unicidad | Datos inconsistentes por lote | Operación manual lenta | Bajo-medio | Mejora operación administrativa | Bajo / Bajo / Medio | 2026-05-15 | Aprobado | Ya aparece en alcance, código y pruebas | Cristian Sinoe Hernández Ruiz | Implementado | commit `aca0b1f`, migraciones `V10`, `V14`, `csv_pruebas/` |
| CC-028 | 2026-05-15 | Frontend | Frontend / Integración | Actualización | Frontend | Implementación del frontend por roles y dashboards | Completar experiencia de usuario | Postman o vistas mínimas | React/Vite, rutas, layouts y páginas por rol | Deuda visual y de estado | Sin capa de presentación usable | Medio | Hace operable el producto | Medio / Medio / Alto | 2026-05-15 | Aprobado | Integrado a `v0.2.0` | Benjamin Emmanuel Coello Trujillo | Implementado | commits `32e0570` a `3bf7dc1`, tag `v0.2.0` |
| CC-029 | 2026-05-15 | Tutor / PM | Frontend / Backend | Actualización | Tutor | Perfil de tutor y preferencias de notificación | Mejorar identidad y contacto académico | Perfil fijo sin edición | Campos y endpoints de perfil | Inconsistencia de datos si falla guardado | Perfil institucional incompleto | Bajo | Mejora completitud funcional | Bajo / Bajo / Medio | 2026-05-17 | Aprobado | Respaldado por migraciones y pantallas | Cristian / Benjamin | Implementado parcial | migración `V17`, `TutorProfileDto`, `TutorProfilePage.jsx` |
| CC-030 | 2026-05-18 | PM / Backend | Seguridad / Frontend / Backend | Acción correctiva | Acceso | Reenvío de OTP y endurecimiento del flujo de acceso | Reducir bloqueo por expiración | Regeneración manual de acceso | DTOs, endpoints, cooldown, UI OTP | Complejidad de flujo y errores UI | Soporte manual recurrente | Bajo | Mejora usabilidad segura | Bajo / Bajo / Bajo | 2026-05-18 | Aprobado | Cambio reconstruido desde estado actual | Cristian / Benjamin | En evaluación | diff actual en `OtpService`, `AuthController`, `AuthDtos`, `OtpPage.jsx` |
| CC-031 | 2026-05-18 | PM / Backend / Frontend | Alcance / Backend / BD / Frontend | Actualización | Conversación académica | Implementación en curso de hilo conversacional y revisiones de mensajes | Mejorar trazabilidad y continuidad del caso | Mantener respuestas lineales | Nuevas entidades, migraciones, endpoints y vistas | Ampliación de alcance y regresiones | Menor trazabilidad conversacional | Medio | Mejora seguimiento académico | Medio / Bajo / Alto | 2026-05-18 | Aprobado | Cambio reconstruido a partir del estado actual del proyecto | Cristian / Benjamin | En evaluación | `QuestionConversationController`, migraciones `V19`-`V22`, diffs en `QaService` y vistas tutor/estudiante |
| CC-032 | 2026-05-23 | QA / Frontend | Testing/Calidad / Frontend | Defecto de reparación | Frontend | Corrección pendiente de hallazgos ESLint en vistas OTP y tutor | Cerrar brecha entre build y calidad estática | Liberar con deuda conocida | Reordenar hooks y limpiar variables no usadas | Riesgo menor de regressions por ajuste | Mantener deuda y bloqueo de lint | Bajo | Mejora disciplina de release | Bajo / Bajo / Bajo | 2026-05-23 | Aprobado | Hallazgo actual reproducible | Benjamin Emmanuel Coello Trujillo | Propuesto | `npm run lint` 2026-05-23: 8 errores |
| CC-033 | 2026-05-23 | PM / QA | Testing/Calidad | Actualización | Validación | Validación ejecutable del estado actual del sistema | Diferenciar implementado de validado | Validación solo documental | `mvn test`, `npm run build`, `npm run lint` | Tiempo de verificación | Estado técnico incierto | Bajo | Provee línea base objetiva | Bajo / Bajo / Bajo | 2026-05-23 | Aprobado | Necesario para cierre del control | Cristian / Yatana | Implementado | `mvn test` exitoso; `npm run build` exitoso; `npm run lint` fallido |

## 7. Observaciones sobre cronograma y EDT/WBS

- No se encontró un archivo independiente de cronograma, Gantt o EDT/WBS en el repositorio.
- Los cambios `CC-001`, `CC-002` y `CC-003` fueron reconstruidos con evidencia indirecta, principalmente por:
  - fechas de `Documentacion/01_Acta_Constitucion_Proyecto.md`
  - fecha base del SRS `2026-04-01`
  - plan de pruebas
  - releases Git del 15 de mayo de 2026
- Por tanto, esas entradas deben entenderse como regularización documental del proyecto y no como extracción literal de un artefacto de cronograma encontrado en disco.

## 8. Resumen ejecutivo

- Total de cambios registrados: 33
- Cambios aprobados: 31
- Cambios rechazados: 0
- Cambios pospuestos: 2
- Cambios implementados: 22
- Cambios validados: 3
- Principales impactos en alcance:
  - incorporación formal de diseño, arquitectura y patrones;
  - ampliación funcional hacia historial, perfil tutor y posible hilo conversacional;
  - consolidación de módulos administrativos y de tutoría.
- Principales impactos en cronograma:
  - necesidad de ordenar fases documentales antes de ejecución;
  - concentración de desarrollo e integración en mayo de 2026;
  - extensión implícita del trabajo hacia actividades de cierre documental y calidad.
- Principales impactos en calidad:
  - backend con pruebas unitarias exitosas;
  - build frontend exitoso;
  - deuda de lint frontend todavía abierta;
  - SonarQube incorporado como evidencia de análisis estático backend.
- Principales impactos técnicos:
  - arquitectura cliente-servidor desacoplada;
  - seguridad con JWT, OTP y reCAPTCHA;
  - versionado de esquema con Flyway;
  - soporte LAN, Docker y resolución dinámica de API;
  - trabajo en curso sobre hilo conversacional y revisiones de mensajes.
- Riesgos detectados:
  - coexistencia de `Flyway` con `ddl-auto=update`;
  - patrones CORS amplios para desarrollo local/LAN;
  - almacenamiento del token en `localStorage`;
  - dependencia de SMTP/correo y proveedores externos;
  - cambios de frontend aún no cerrados en lint;
  - ausencia de evidencia exacta de cronograma/EDT versionados.
- Decisiones relevantes del Project Manager:
  - mantener la estrategia de ramas `main/release/develop`;
  - formalizar control de cambios y actas semanales;
  - separar ambientes de prueba y endurecer seguridad;
  - documentar explícitamente limitaciones y trabajo futuro;
  - no registrar como implementado aquello que solo está propuesto o en diff local.
- Recomendaciones para seguimiento:
  - cerrar `CC-032` antes de un siguiente release;
  - decidir formalmente si `CC-031` entra al alcance base o queda como mejora;
  - crear un cronograma y EDT/WBS versionados en el repositorio;
  - registrar evidencia funcional por rol con IDs de incidencias ClickUp;
  - definir lineamientos de producción para CORS, correo y gestión de secretos.
