# Informe de Cierre del Proyecto TutorLink

## 1. Datos Generales del Proyecto

| Campo | Descripcion |
| --- | --- |
| Nombre del proyecto | TutorLink |
| Version o fase cerrada | Cierre tecnico y academico de la fase integrada en `main` |
| Fecha de cierre | 01 de junio de 2026 |
| Project Manager / Backend | Cristian Sinoe Hernandez Ruiz |
| Frontend | Benjamin Emmanuel Coello Trujillo |
| QA / Product Owner | Yatana Roa |
| Rama final estable | `main` |
| Estado final del proyecto | Cerrado tecnicamente para entrega academica, con observaciones de mejora continua |
| Objetivo general | Entregar un sistema de gestion de tutorias academicas con autenticacion, roles, administracion de usuarios, preguntas academicas, respuestas de tutores, seguridad y validaciones de calidad. |

TutorLink es un sistema academico orientado a gestionar procesos de tutorias mediante un backend en Spring Boot, un frontend en React con Vite y una base de datos PostgreSQL versionada con migraciones. El cierre documenta la integracion final, las validaciones tecnicas y la aceptacion formal de entregables.

## 2. Resumen Ejecutivo

Durante el cierre se completo la integracion del trabajo de QA, SonarQube, pruebas automatizadas y correcciones de calidad hacia las ramas principales del repositorio. El flujo de ramas finalizo correctamente en `main` siguiendo la ruta `yatana -> develop -> release -> main`.

Se validaron las compuertas tecnicas del backend y frontend, incluyendo pruebas automatizadas, cobertura, lint, build y workflows de GitHub Actions. Tambien se corrigieron issues de SonarQube tanto en backend como en frontend, dejando el proyecto en un estado apto para revision academica y tecnica.

El cierre significa que los entregables principales quedaron integrados en la rama estable `main`, con evidencia de validacion y con pendientes razonables documentados para fases posteriores. No implica que el producto sea perfecto o productivo al 100%, sino que la fase actual cumple los criterios de aceptacion definidos para la entrega.

## 3. Aceptacion Formal de Entregables

Los entregables tecnicos principales fueron integrados, validados y aceptados para el cierre de la fase. La aceptacion se basa en el cumplimiento de requisitos funcionales principales, ejecucion de pruebas, correcciones de calidad, estado de workflows y consolidacion documental.

| Entregable | Estado | Evidencia tecnica |
| --- | --- | --- |
| Backend funcional | Aceptado | `mvn test jacoco:report` con `BUILD SUCCESS` |
| Frontend funcional | Aceptado | `npm test -- --run` y `npm run build` exitosos |
| Base de datos versionada | Aceptado | Migraciones Flyway integradas en el repositorio |
| Seguridad y autenticacion | Aceptado con observaciones | JWT, OTP, reCAPTCHA y roles validados por pruebas y flujo funcional |
| Gestion de usuarios | Aceptado | Pruebas backend/frontend y vistas administrativas |
| Gestion de tutorias y preguntas | Aceptado | Pruebas de preguntas, respuestas y flujo tutor-estudiante |
| Pruebas backend | Aceptado | 103 pruebas, 0 failures, 0 errors, 30 skipped |
| Pruebas frontend | Aceptado | 29 pruebas aprobadas |
| Analisis SonarQube | Aceptado | Issues backend y frontend corregidos |
| Workflows GitHub Actions | Aceptado | Workflows backend/frontend en verde |
| Documentacion tecnica y de cierre | Aceptado | Documentacion QA y cierre del proyecto |

**Estado de incidencias finales:** las incidencias criticas detectadas durante el cierre fueron corregidas. Permanecen recomendaciones no bloqueantes, como incrementar cobertura, revisar warnings de build y mantener analisis SonarQube por release.

**Criterio de cierre:** el proyecto/fase queda cerrado tecnicamente cuando los entregables principales estan integrados en `main`, los workflows pasan, las pruebas obligatorias son exitosas y las limitaciones conocidas quedan documentadas.

**Pendiente de firma/aprobacion:** la aprobacion formal del patrocinador, docente o responsable academico queda pendiente de firma en el acta de cierre.

## 4. Informe Final de Desempeno

| Area | Planificado | Resultado real | Estado | Observaciones |
| --- | --- | --- | --- | --- |
| Alcance backend | API funcional con seguridad, roles, usuarios y preguntas | Backend integrado y validado | Cumplido | Incluye autenticacion, auditoria, usuarios y gestion academica |
| Alcance frontend | Interfaz React para autenticacion, administracion, estudiante y tutor | Frontend integrado y validado | Cumplido | Build exitoso con warnings no bloqueantes |
| Base de datos | PostgreSQL con migraciones controladas | Migraciones versionadas con Flyway | Cumplido | Requiere mantener disciplina de migraciones futuras |
| Calidad backend | Pruebas y analisis estatico | 103 tests, 0 failures, 0 errors, 30 skipped | Cumplido con observaciones | Skips asociados a entorno Docker/Testcontainers |
| Calidad frontend | Lint, pruebas, coverage y build | 29 tests passed; cobertura aproximada 27.48% | Cumplido con observaciones | Cobertura inicial, mejorable en futuras fases |
| SonarQube | Corregir issues detectados | Issues backend/frontend corregidos | Cumplido | Requiere reejecucion periodica |
| GitHub Actions | Workflows en verde | Workflows backend/frontend en verde | Cumplido | Validacion automatizada integrada |
| Integracion de ramas | `yatana -> develop -> release -> main` | Flujo completado | Cumplido | Sin force push y sin tag en esta etapa |
| Cronograma | Cierre al finalizar QA/Sonar | Cierre completado tras correcciones iterativas | Cumplido con ajustes | Se resolvieron fallos de CI antes de cerrar |

## 5. Control de Calidad y Validaciones

| Validacion | Comando/herramienta | Resultado | Estado |
| --- | --- | --- | --- |
| Pruebas backend y cobertura | `mvn test jacoco:report` | `BUILD SUCCESS`, 103 tests, 0 failures, 0 errors, 30 skipped | Aprobado |
| Lint frontend | `npm run lint` | OK | Aprobado |
| Pruebas frontend | `npm test -- --run` | 29 tests passed | Aprobado |
| Cobertura frontend | `npm run test:coverage -- --run` | OK, cobertura global aproximada 27.48% | Aprobado con observaciones |
| Build frontend | `npm run build` | OK, warnings de Browserslist/chunk size | Aprobado |
| SonarQube backend | Analisis SonarQube | Issues corregidos | Aprobado |
| SonarQube frontend | Analisis SonarQube | Issues corregidos | Aprobado |
| GitHub Actions | Workflows backend/frontend | Workflows en verde | Aprobado |
| Validacion de ramas | Git merge y push | `yatana`, `develop`, `release` y `main` integradas | Aprobado |

La validacion de backend reporto 30 pruebas omitidas. Este comportamiento esta documentado como una limitacion esperada cuando el entorno local no cuenta con Docker/Testcontainers disponible o compatible. En GitHub Actions los workflows quedaron en verde.

## 6. Gestion de Incidentes y Resolucion Final

| Incidente | Impacto | Accion correctiva | Resultado final |
| --- | --- | --- | --- |
| Fallos iniciales en workflow backend | Bloqueo de PR e integracion | Revision de logs, correccion de ciclo de dependencias y estabilizacion de pruebas | Backend en verde |
| Desalineacion de tests backend con respuestas reales de API | Fallos por JSON paths incorrectos | Ajuste de aserciones a contrato real de API | Pruebas backend exitosas |
| Issues de SonarQube backend | Riesgo de mantenibilidad | Extraccion de constantes y limpieza de imports/literales | Issues corregidos |
| Issues de SonarQube frontend | Riesgo de mantenibilidad/accesibilidad | Refactors menores, contrastes, PropTypes y limpieza de patrones | Issues corregidos |
| Fallo de tests frontend por reCAPTCHA | CI frontend inestable | Configuracion de entorno de test con site key falsa estable | Tests frontend exitosos |
| Fallo temporal de red al hacer pull de `main` | Interrupcion del merge final | Detencion segura y reintento posterior con conectividad restaurada | Integracion `release -> main` completada |
| Riesgo de subir artefactos generados | Posible contaminacion del repo | Verificacion de `git status` y staging selectivo | No se subieron artefactos generados |

## 7. Gestion de Riesgos

| Riesgo | Tipo | Respuesta aplicada | Efectividad | Estado final |
| --- | --- | --- | --- | --- |
| Mezclar cambios funcionales ajenos con QA/Sonar | Tecnico / configuracion | Stash temporal y staging selectivo | Alta | Controlado |
| Subir artefactos no trackeados como coverage o scannerwork | Repositorio | Verificacion de estado Git antes de commits/push | Alta | Controlado |
| Romper workflow al corregir Sonar | Calidad | Validaciones locales antes de push | Alta | Controlado |
| Conflictos entre ramas principales | Integracion | Merges `--no-ff` y detencion ante conflicto | Alta | Controlado |
| Perdida de cambios locales | Operativo | Stash nombrado antes de cambiar ramas | Alta | Controlado |
| Configuracion incompleta de reCAPTCHA en tests | Calidad frontend | `VITE_RECAPTCHA_SITE_KEY` falsa en entorno Vitest | Alta | Controlado |
| Cobertura inicial baja | Calidad | Medicion y documentacion sin umbrales agresivos | Media | Pendiente de mejora |
| Warnings de build por chunk size | Rendimiento | Documentacion como warning no bloqueante | Media | Pendiente de optimizacion |

## 8. Lecciones Aprendidas

### 8.1 Que salio bien

- La separacion de ramas permitio controlar el flujo desde QA hasta `main`.
- Los workflows de GitHub Actions ayudaron a detectar errores reales antes del cierre.
- La combinacion de pruebas backend, frontend, coverage y SonarQube incremento la confianza en la entrega.
- El staging selectivo evito mezclar cambios funcionales ajenos con commits de calidad.
- La documentacion QA facilito explicar skipped tests, cobertura y limitaciones.

### 8.2 Que salio mal o genero retraso

- Algunos tests estaban desalineados con respuestas reales de la API.
- La configuracion de reCAPTCHA en CI requirio estabilizacion especifica.
- Testcontainers dependio del estado local de Docker, generando skipped tests en ciertos entornos.
- La correccion de SonarQube frontend requirio iteraciones por issues residuales.
- Hubo un fallo temporal de red al hacer `pull` de `main`.

### 8.3 Que se haria diferente

- Alinear contratos de API y tests de integracion desde etapas mas tempranas.
- Separar con mayor anticipacion commits funcionales, QA, Sonar y documentacion.
- Ejecutar SonarQube antes de abrir PRs finales.
- Mantener un checklist de artefactos generados para evitar ruido en `git status`.
- Definir variables de entorno de prueba desde la configuracion inicial del frontend.

### 8.4 Recomendaciones para futuros proyectos

- No usar `git add .` en etapas criticas de release.
- Validar localmente antes de pushear cambios de QA o Sonar.
- Mantener tests alineados con contratos reales de API.
- Evitar correcciones de Sonar que cambien comportamiento funcional.
- Mantener limpieza de artefactos como `coverage`, `.scannerwork` y evidencias automaticas.
- Documentar claramente la estrategia de ramas y el criterio de cierre.

## 9. Evaluacion de Satisfaccion del Cliente y del Equipo

| Criterio | Evaluacion | Observaciones |
| --- | --- | --- |
| Satisfaccion del equipo | Alta | El proyecto llego a una integracion final estable y validada |
| Satisfaccion esperada del docente/patrocinador | Alta con observaciones | Se entrega evidencia tecnica y academica; quedan mejoras futuras documentadas |
| Comunicacion del equipo | Adecuada | La division Backend, Frontend y QA/Product Owner permitio seguimiento por areas |
| Calidad percibida del producto | Buena | Workflows, pruebas y SonarQube fortalecen la entrega |
| Areas de mejora | Identificadas | Cobertura, optimizacion de bundle, despliegue y documentacion de usuario |

Al tratarse de un proyecto academico, esta evaluacion se presenta como cierre interno y no sustituye una aprobacion formal del docente o patrocinador.

## 10. Transferencia de Conocimiento y Documentacion Final

### Backend

El backend esta construido con Spring Boot 3, Java 17, JPA/Hibernate, Flyway y PostgreSQL. Quien mantenga el sistema debe conocer seguridad con JWT, OTP, roles, migraciones Flyway y pruebas con Maven/Testcontainers.

Comando principal de validacion:

```bash
cd backend
mvn test jacoco:report
```

### Frontend

El frontend esta construido con React y Vite. Incluye rutas protegidas, flujos por rol, pruebas con Vitest/React Testing Library y configuracion de cobertura.

Comandos principales:

```bash
cd frontend
npm run lint
npm test -- --run
npm run test:coverage -- --run
npm run build
```

### Base de datos

PostgreSQL se administra mediante migraciones versionadas con Flyway. Las futuras modificaciones de esquema deben agregarse como nuevas migraciones, sin alterar migraciones ya aplicadas en ambientes compartidos.

### Pruebas

El proyecto cuenta con pruebas backend unitarias/integracion y pruebas frontend. Cypress queda configurado para escenarios E2E, con ejecucion local/manual segun disponibilidad del entorno.

### Calidad

SonarQube se utilizo para identificar y corregir issues de mantenibilidad, accesibilidad y calidad. Se recomienda ejecutar SonarQube en cada release.

### CI/CD

GitHub Actions valida backend y frontend. Las compuertas incluyen pruebas, coverage, lint y build.

### Repositorio Git

El estado final quedo integrado en:

- `yatana`: QA, pruebas, Sonar y validaciones.
- `develop`: integracion de desarrollo.
- `release`: preparacion de liberacion.
- `main`: rama final estable.

## 11. Cierre Administrativo, Financiero y de Recursos

| Elemento | Estado | Observaciones |
| --- | --- | --- |
| Contratos con proveedores | No aplicable | Proyecto academico sin proveedores formales |
| Cierre financiero | No aplicable | No hubo pagos ni presupuesto operativo real |
| Recursos humanos | Cerrado para la fase | El equipo libera actividades de cierre tecnico |
| Evidencias | Archivadas | Evidencia en repositorio, historial Git y workflows |
| Repositorio | Conservado | Historial Git funciona como evidencia tecnica |
| Documentacion | Integrada | Documentacion QA y cierre disponible en Markdown |

## 12. Estado Final de Ramas

| Rama | Proposito | Estado | Observaciones |
| --- | --- | --- | --- |
| `yatana` | QA, pruebas, Sonar y validaciones | Validada | Base de calidad integrada |
| `develop` | Integracion de desarrollo | Integrada | Recibio cambios desde `yatana` |
| `release` | Preparacion de release | Integrada | Recibio cambios desde `develop` |
| `main` | Version final estable | Integrada y estable | Recibio cambios desde `release` |

Flujo final completado:

- `merge(yatana): integrate QA and Sonar fixes` en `develop`.
- `merge(develop): prepare QA and Sonar release` en `release`.
- `release: integrate QA and Sonar fixes` en `main`.

## 13. Pendientes y Recomendaciones Posteriores

- Crear tag de version, por ejemplo `v0.3.0`, cuando el equipo confirme el cierre formal.
- Mantener SonarQube como revision recurrente por release.
- Incrementar cobertura de pruebas backend y frontend.
- Revisar warnings de build por chunk size y evaluar code splitting.
- Revisar vulnerabilidades reportadas por `npm audit`, si existen.
- Mantener y ampliar documentacion de usuario.
- Evaluar despliegue futuro en ambiente controlado.
- Formalizar aprobacion docente/patrocinador con firma o evidencia academica.

## 14. Acta de Cierre

Por medio del presente informe se declara cerrado tecnicamente el proyecto/fase TutorLink correspondiente a la integracion final validada en `main`.

Los entregables principales fueron integrados, las validaciones tecnicas fueron satisfactorias y el equipo acepta el cierre tecnico de la fase, dejando documentadas las observaciones y recomendaciones para mantenimiento o evolucion posterior.

| Rol | Nombre | Firma | Fecha |
| --- | --- | --- | --- |
| Project Manager / Backend | Cristian Sinoe Hernandez Ruiz |  |  |
| Frontend | Benjamin Emmanuel Coello Trujillo |  |  |
| QA / Product Owner | Yatana Roa |  |  |
| Docente / Patrocinador |  |  |  |

## 15. Celebracion y Reconocimiento

Se reconoce el trabajo del equipo TutorLink por completar una fase de cierre con integracion ordenada, validaciones tecnicas, correcciones de calidad y documentacion academica. El cierre representa un esfuerzo conjunto de desarrollo, pruebas, control de calidad y disciplina de repositorio.

Este informe deja constancia del avance logrado y sirve como base para futuras mejoras, presentacion academica y continuidad tecnica del proyecto.
