# Plan de Pruebas del Software

## Base tecnologica verificada

- Frontend: `React 19 + Vite 7.2.4`
- Backend: `Spring Boot 3.3.4` sobre `Java 17`
- Base de datos: `PostgreSQL`
- Persistencia y control de esquema: `JPA/Hibernate` + `Flyway`
- Seguridad: `Spring Security`, `JWT`, `OTP`, `reCAPTCHA`
- Gestion de incidencias: `ClickUp`

## Estado actual del proyecto y criterio de redaccion

TutorLink se encuentra en una madurez incremental. El backend academico integrado fue validado con `mvn test`, con resultado `BUILD SUCCESS`, `26 tests` ejecutados, `0 failures`, `0 errors` y `1 skipped`.

El frontend academico integrado fue validado con `npm run build` exitoso. La configuracion de `ESLint` ya existia en el repositorio, pero al inicio de esta Fase 1 `npm run lint` reportaba 8 errores reales en archivos del frontend. Esta fase corrige esos hallazgos minimos, sin alterar logica funcional, para habilitar la compuerta automatica de calidad en CI.

Por lo anterior, este plan distingue entre:

- capacidades **ya verificadas** en `v0.1.0` y `v0.2.0`;
- capacidades **incorporadas en esta Fase 1** para preparar `v0.3.0`;
- capacidades **propuestas** o **recomendadas** para fases posteriores de QA.

El objetivo es dejar una estrategia de calidad progresiva, tecnica y defendible, alineada con el estado real del repositorio.

## Avance Fase 2

La Fase 2 amplia la cobertura unitaria del backend usando `JUnit 5` y `Mockito`, sin base de datos real y sin levantar el contexto completo de Spring.

Servicios cubiertos en esta fase:

- `OtpService`
- `UserService`
- `TutorStudentAssignmentService`
- `AuditService`
- ampliaciones sobre `QaService`, `AdminUserService` y `JwtService`

Reglas de negocio protegidas en esta fase:

- generacion, validacion, expiracion e intento maximo de `OTP`;
- normalizacion de correo, hashing y claims basicos para autenticacion mediante `UserService`, `JwtService` y `OtpService`, dado que no existe `AuthService`;
- asignacion tutor-estudiante y conteo de resultados de importacion CSV;
- validaciones reales de preguntas, respuestas y mensajeria conversacional en `QaService`;
- construccion correcta de registros de auditoria a traves de `AuditService`.

Pendiente para Fase 3:

- pruebas de integracion y de controladores;
- `Cypress` y validacion `E2E`;
- `Testcontainers`;
- `SonarQube` o `SonarCloud`;
- `JaCoCo` y cobertura formal;
- evidencia automatizada adicional y compuertas de calidad mas avanzadas.

## Avance Fase 3

La Fase 3 agrega pruebas de integracion backend con `Spring Boot Test`, `MockMvc`, `Flyway` y `Testcontainers` usando `PostgreSQL` aislado para pruebas.

Endpoints cubiertos en esta fase:

- `POST /api/auth/login`
- `POST /api/auth/login/verify-otp`
- `GET /api/me`
- `POST /api/student/questions`
- `GET /api/student/questions/my`
- `GET /api/student/questions/{id}`
- `GET /api/student/questions/{id}/answers`
- `GET /api/tutor/questions/pending`
- `POST /api/tutor/questions/{id}/answer`
- `POST /api/tutor/questions/{id}/reject`
- `POST /api/tutor/questions/{id}/reclassify`
- `GET /api/admin/users`
- `PATCH /api/admin/users/{userId}/status`
- `POST /api/admin/users/tutor-students/assign`
- `GET /api/admin/users/tutor-students`

Reglas de seguridad cubiertas:

- acceso permitido con `JWT` valido y rol correcto;
- bloqueo de acceso por rol incorrecto;
- cobertura del flujo de autenticacion con `OTP`;
- cobertura de acceso protegido sobre rutas de estudiante, tutor y administrador.

Auditoria en esta fase:

- cubierta mediante persistencia real sobre `tl_audit_log` para acciones de login, creacion de pregunta y respuesta del tutor.

Estrategia usada:

- `Spring Boot Test`
- `MockMvc`
- `Testcontainers PostgreSQL`
- `Flyway`
- mocks para `RecaptchaService` y `EmailService`

Limitaciones encontradas:

- el arbol de trabajo del proyecto sigue sucio con cambios funcionales ajenos, por lo que las pruebas de Fase 3 se limitan a infraestructura QA e integracion backend;
- el comportamiento exacto de respuestas sin autenticacion depende de la configuracion actual de Spring Security del proyecto.

Pendiente para Fase 4:

- pruebas `E2E` con `Cypress`;
- mayor cobertura de integracion conversacional y flujos administrativos secundarios;
- incorporacion de analisis estatico avanzado y cobertura formal.

## 1. Estrategia y Enfoque de las Pruebas

El presente plan define la estrategia de aseguramiento de calidad de `TutorLink`, combinando verificacion estatica y dinamica para contrastar el comportamiento del sistema contra requisitos, reglas de negocio y criterios de aceptacion.

### 1.1 Alcance

El alcance cubre los flujos principales observados en el codigo y en la arquitectura actual:

- autenticacion con credenciales, `OTP` y `reCAPTCHA`;
- primer acceso y cambio de contrasena;
- gestion administrativa de usuarios;
- activacion y desactivacion de usuarios;
- importacion de usuarios y asignaciones por `CSV`;
- asignacion tutor-estudiante;
- creacion y consulta de preguntas por el estudiante;
- respuesta, correccion, rechazo y reclasificacion por el tutor;
- dashboards por rol;
- auditoria y controles de acceso por rol;
- consistencia de datos y migraciones `Flyway`.

### 1.2 Principios de diseno de pruebas

- valores limite para campos criticos;
- clases de equivalencia para entradas validas e invalidas;
- tablas de decision para combinaciones de autenticacion y estados;
- pruebas basadas en riesgo para seguridad, asignaciones, historial y configuracion.

### 1.3 Estructura minima de los casos de prueba

Cada caso de prueba debe documentar como minimo:

- identificador unico;
- modulo o funcionalidad;
- objetivo;
- precondiciones;
- datos de entrada;
- pasos;
- resultado esperado;
- resultado obtenido;
- evidencia;
- estado final;
- identificador de incidencia en `ClickUp`, si aplica.

## 2. Pruebas estaticas

Las pruebas estaticas se usan para detectar problemas de calidad, mantenibilidad, seguridad y configuracion antes de la ejecucion completa del sistema.

### 2.1 Objetivos

- detectar defectos de codigo antes de la ejecucion;
- reducir deuda tecnica;
- revisar vulnerabilidades de dependencias y configuraciones;
- validar que el repositorio no exponga secretos ni artefactos temporales;
- preparar la base de calidad para `v0.3.0`.

### 2.2 Actividades estaticas de Fase 1

| Actividad | Alcance en TutorLink | Estado en Fase 1 |
| --- | --- | --- |
| `ESLint` en frontend | calidad de componentes, hooks, rutas, formularios y utilidades React | operativo como compuerta CI |
| Revision de configuracion | `.env.example`, `.gitignore`, rutas y estructura del repo | verificada |
| Revision de artefactos temporales | `node_modules`, `dist`, `target`, logs y secretos | verificada |
| `SonarQube` o `SonarCloud` | analisis backend y frontend | no incorporado en esta fase |
| `npm audit` | vulnerabilidades del frontend | recomendado para Fase 2 |
| Cobertura con `JaCoCo` o `Vitest` | medicion formal de cobertura | no incorporada en esta fase |

### 2.3 Estado real incorporado en esta fase

- `ESLint` ya estaba configurado en frontend.
- `npm run lint` se deja como compuerta automatica.
- se corrigieron unicamente hallazgos estructurales minimos de hooks y variables no usadas para habilitar CI;
- no se agregaron nuevas herramientas de analisis estatico.

### 2.4 Criterios minimos de revision estatica

- `npm run lint` debe finalizar sin errores;
- no deben existir secretos reales en archivos versionados de ejemplo;
- las carpetas y archivos temporales deben permanecer fuera del control de versiones;
- no se introducen herramientas nuevas de analisis fuera del alcance de la fase.

## 3. Pruebas dinamicas

Las pruebas dinamicas validan el comportamiento real del software en ejecucion.

### 3.1 Objetivos

- verificar comportamiento observable;
- validar entradas, salidas y restricciones;
- confirmar integracion entre capas;
- detectar regresiones;
- medir estabilidad de la solucion.

### 3.2 Tipos de pruebas dinamicas incluidos en la estrategia general

- unitarias;
- de integracion;
- de sistema;
- `E2E`;
- de aceptacion;
- de regresion;
- de desempeno;
- piloto.

### 3.3 Estado actual vs Fase 1

- backend: pruebas unitarias existentes y ejecutables con `mvn test`;
- frontend: build ejecutable con `npm run build`;
- Fase 1 no agrega nuevas pruebas dinamicas;
- integracion, `E2E`, desempeno y piloto quedan pendientes para Fase 2 o posteriores.

## 4. Niveles y Tipos de Pruebas a Ejecutar

### 4.1 Pruebas unitarias

#### Backend

- Herramientas actuales: `JUnit 5`, `Mockito`, `Spring Boot Test` selectivo.
- Estado observable: existen pruebas para `JwtService`, `QaService`, `AdminUserService`, `AllowedProfileService`, `AdminCredentialPolicy`, `AdminProvisioningService` y `AgeValidator`.
- Pendiente para Fase 2: ampliar cobertura hacia autenticacion, `OTP`, asignaciones y control de acceso.

#### Frontend

- Herramientas propuestas: `Vitest` y `React Testing Library`.
- Estado actual: no se incorporan en Fase 1.

### 4.2 Pruebas de integracion

- Propuestas para `v0.3.0` posterior.
- No se implementan en esta fase.
- Alcance futuro: `MockMvc`, `Spring Boot Test`, `Flyway` y, si se aprueba luego, `Testcontainers`.

### 4.3 Pruebas de sistema

- Definidas como alcance futuro para validar flujos completos por rol.
- No se incorporan automatizaciones ni nuevos casos en Fase 1.

### 4.4 Pruebas `E2E`

- `Cypress` queda reservado para Fase 2.
- La estructura de evidencias se deja lista, pero no se agrega dependencia ni configuracion.

### 4.5 Pruebas de interfaz grafica

- Se mantienen como validacion manual o futura automatizacion.
- Fase 1 no cambia comportamiento visual.

### 4.6 Pruebas de integridad de BD

- Se mantienen como linea de trabajo futura apoyada en `PostgreSQL` y `Flyway`.
- No se agregan scripts nuevos en esta fase.

### 4.7 Pruebas de desempeno

- `JMeter` u otra herramienta quedan fuera de Fase 1.

### 4.8 Pruebas de aceptacion

- Se conservan como parte del marco documental y de la trazabilidad funcional.
- No se agregan casos ejecutables nuevos en esta fase.

### 4.9 Pruebas piloto

- Quedan para validacion controlada previa a liberacion productiva.

### 4.10 Pruebas de regresion

- En Fase 1 la regresion automatica minima queda representada por:
  - `mvn test`
  - `npm run lint`
  - `npm run build`

## 5. Matriz de trazabilidad

| Requisito / Funcionalidad | Evidencia actual | Estado |
| --- | --- | --- |
| `RF-AUTH` Login y `OTP` | pruebas backend existentes, build frontend, compuerta lint | parcial actual |
| `RF-STU` Crear pregunta | cobertura backend parcial observada en servicios | parcial actual |
| `RF-TUT` Responder pregunta | cobertura backend parcial observada en servicios | parcial actual |
| `RF-ADM` Gestion de usuarios | pruebas backend de administracion existentes | parcial actual |
| `RNF-SEG` Control de acceso | seguridad backend configurada y pruebas unitarias parciales | parcial actual |
| `RNF-CAL` Calidad estatica | `ESLint`, `.gitignore`, validaciones CI | implementado en Fase 1 |

## 6. Estrategia CI/CD y automatizacion de calidad

Para `v0.3.0`, esta fase incorpora validaciones automatizadas minimas mediante `GitHub Actions`.

### 6.1 Workflow incorporado en Fase 1

Se agrega un workflow unificado:

- `.github/workflows/quality-ci.yml`

Con jobs separados:

- `backend`
  - `actions/checkout`
  - `actions/setup-java` con Java 17 y cache Maven
  - `working-directory: backend`
  - `mvn test`
- `frontend`
  - `actions/checkout`
  - `actions/setup-node` con Node LTS compatible
  - cache `npm` usando `frontend/package-lock.json`
  - `working-directory: frontend`
  - `npm ci`
  - `npm run lint`
  - `npm run build`

### 6.2 Ramas objetivo

El workflow debe correr en:

- `push` a `yatana`, `develop`, `release`, `main`;
- `pull_request` hacia `yatana`, `develop`, `release`, `main`.

### 6.3 Criterios automaticos de compuerta

- no se libera si fallan los tests backend;
- no se libera si falla `lint`;
- no se libera si falla el build del frontend.

### 6.4 Pendiente para Fase 2

- `Cypress`
- `SonarQube` o `SonarCloud`
- `JaCoCo`
- `Testcontainers`
- integracion API/E2E

## Estrategia de madurez por releases

### `v0.1.0`

- backend academico integrado;
- pruebas backend ejecutables.

### `v0.2.0`

- frontend academico integrado;
- build frontend ejecutable.

### `v0.3.0`

- documentacion QA base;
- estructura de evidencias;
- compuertas CI minimas;
- lint frontend corregido para operar como compuerta;
- pruebas avanzadas aun pendientes.

## 8. Criterios de entrada y salida

### 8.1 Criterios de entrada

- backend y frontend presentes y con estructura funcional en el repo;
- `PostgreSQL` y variables de entorno ya gestionadas fuera de secretos versionados;
- usuarios de prueba y datos semilla disponibles cuando aplique;
- `.env.example` sin secretos reales.

### 8.2 Criterios de salida

- existe `qa/plan-pruebas.md`;
- existe `qa/README.md`;
- existe la estructura `qa/evidencias/*`;
- existe el workflow `.github/workflows/quality-ci.yml`;
- `mvn test`, `npm run lint` y `npm run build` pasan en el estado final de la fase;
- no se modifica logica de negocio ni configuracion sensible.

## 9. Asignacion de roles para las pruebas

| Rol | Responsabilidad |
| --- | --- |
| Project Manager | seguimiento del avance QA y control de hitos |
| Backend | mantenimiento y ejecucion de pruebas backend |
| Frontend | mantenimiento de calidad estatica y build frontend |
| QA / validacion funcional | trazabilidad, evidencias e incidencias en `ClickUp` |
| DevOps / CI | automatizacion de compuertas en `GitHub Actions` |

## 10. Herramientas y gestion de incidencias

### 10.1 Herramientas activas en Fase 1

- `mvn test`
- `npm run lint`
- `npm run build`
- `GitHub Actions`
- `ClickUp`

### 10.2 Herramientas previstas para fases posteriores

- `Vitest`
- `React Testing Library`
- `Cypress`
- `Postman` o `Newman`
- `JMeter`
- `JaCoCo`
- `SonarQube` o `SonarCloud`
- `Testcontainers`

### 10.3 Flujo de incidencias en ClickUp

Todo bug debe registrarse con:

- titulo claro;
- modulo afectado;
- pasos para reproducir;
- comportamiento actual;
- comportamiento esperado;
- severidad;
- ambiente;
- evidencia;
- version detectada.

Flujo sugerido:

`Nuevo -> En Analisis -> Asignado -> En Desarrollo -> En QA -> Cerrado`

## 11. Evidencias de prueba

### 11.1 Tipos de evidencia

- capturas de pantalla;
- videos cortos;
- logs;
- resultados de consola;
- exportaciones o artefactos de API;
- reportes futuros de herramientas automatizadas.

### 11.2 Estructura versionada en esta fase

```text
qa/evidencias/
qa/evidencias/cypress/
qa/evidencias/sonar/
qa/evidencias/jacoco/
qa/evidencias/postman/
qa/evidencias/capturas/
```

## 12. Metricas de calidad y criterios absolutos de aceptacion

### 12.1 Metricas base de Fase 1

- estado de `mvn test`;
- estado de `npm run lint`;
- estado de `npm run build`;
- presencia de estructura documental QA;
- presencia de compuertas CI en ramas principales.

### 12.2 Criterios de aceptacion release para esta fase

- `0` errores en `npm run lint`;
- `mvn test` exitoso;
- `npm run build` exitoso;
- workflow CI presente y listo para ejecutarse en `yatana`, `develop`, `release` y `main`;
- sin cambios funcionales de negocio.

## 13. Plan de implementacion QA en rama `yatana`

Secuencia materializada en Fase 1:

```text
docs(qa): add QA repository structure
docs(qa): add testing plan and QA README
ci(quality): add unified validation workflow
fix(frontend): resolve existing lint blockers for CI gate
```

Pendiente para Fase 2:

```text
test(backend): expand unit coverage for core services
test(integration): add API integration tests
test(e2e): scaffold Cypress for TutorLink
ci(quality): add advanced quality gates
docs(qa): add evidence checklist and release criteria refinement
```

## Avance de la Fase 4

- se incorpora `Vitest` con entorno `jsdom` y `React Testing Library`;
- se agregan pruebas frontend sobre `LoginPage`, `OtpPage`, `StudentDashboard`, `StudentNewQuestion`, `StudentQuestions`, `TutorPendingPage`, `UsersPage`, `AssignmentsPage` y guardas de rutas;
- se validan flujos visibles de autenticacion, OTP, registro de pregunta, historial, respuesta del tutor, gestion visual de usuarios, modal de importacion CSV y control de acceso por rol;
- la estrategia usada en esta fase se basa en mocks de `apiClient`, `MemoryRouter`, `AuthContext.Provider` y dobles de `reCAPTCHA`, sin dependencia del backend real;
- se actualiza la compuerta CI frontend para ejecutar `npm ci`, `npm run lint`, `npm test` y `npm run build`.

Limitaciones actuales:

- no se agregan pruebas `E2E`;
- no se usa `Cypress`;
- no se introducen snapshots ni cobertura formal;
- los flujos se validan a nivel de interfaz y comportamiento visible, no contra servicios reales.

Pendiente para Fase 5:

- pruebas `E2E` con `Cypress`;
- cobertura frontend y backend;
- evidencias automatizadas adicionales para liberacion;
- consolidacion de trazabilidad completa entre requisitos, UI, API y pruebas.

## Avance de la Fase 5

- se incorpora `Cypress` para pruebas `E2E` del frontend bajo una estrategia hibrida;
- se cubren flujos de autenticacion visual, estudiante, tutor, administrador y control de acceso por rol;
- la ejecucion principal usa `cy.intercept()` y fixtures para evitar dependencia de cuentas reales, `SMTP`, `OTP` externos o backend real;
- se documenta una ruta opcional de smoke local con `docker compose`, pero no forma parte de la compuerta normal de `cy:run`;
- se generan evidencias estandar en `frontend/cypress/screenshots/` y `frontend/cypress/videos/`, con respaldo documental en `qa/evidencias/cypress/README.md`.

Limitaciones actuales:

- el login `OTP` completamente real sigue dependiendo de correo y servicios externos;
- no se integra `Cypress` al workflow CI en esta fase para no volver inestable la compuerta actual;
- la ruta recomendada y estable es local/manual con frontend levantado y respuestas mockeadas.

Pendiente para Fase 6:

- cobertura y reportes avanzados;
- integracion progresiva de ejecucion `E2E` en CI cuando exista una estrategia estable para `OTP`/correo;
- consolidacion de evidencias automatizadas y calidad avanzada.

## Avance de la Fase 6

- se incorpora cobertura backend con `JaCoCo` para generar reportes HTML y XML sin cambiar la logica funcional;
- se incorpora cobertura frontend con `Vitest` usando el proveedor `v8`, con salidas HTML y `lcov`;
- en la medicion actual se obtuvo cobertura backend de lineas de `22.87%` y cobertura global frontend de `26.55%`;
- se prepara `SonarQube` o `SonarCloud` mediante `sonar-project.properties`, sin tokens ni configuracion sensible;
- se actualiza el workflow CI para conservar las compuertas existentes y agregar generacion de cobertura en backend y frontend;
- se documentan evidencias reproducibles para `JaCoCo`, cobertura frontend y `Sonar`;
- no se vuelve obligatorio `Sonar` en CI ni se fuerzan umbrales de cobertura en esta fase.

Limitaciones actuales:

- la cobertura se mide y reporta, pero no se usa todavia como quality gate con umbral estricto;
- `Cypress` sigue siendo local/manual y no forma parte de la compuerta automatica de esta fase;
- los tests de integracion backend basados en `Testcontainers` pueden quedar omitidos si el entorno no ofrece Docker operativo.

Pendiente para cierre QA posterior:

- decidir umbrales minimos de cobertura cuando las metricas base ya esten consolidadas;
- habilitar `Sonar` en CI solo cuando existan secretos y configuracion externa estable;
- estabilizar por completo la ejecucion `E2E` local para todos los entornos del equipo.

## Metricas QA para `v0.3.0`

| Metrica | Valor / criterio |
| --- | --- |
| Pruebas backend totales | `103` al ejecutar `mvn test` |
| Pruebas frontend totales | `29` al ejecutar `npm test` |
| Pruebas `E2E` Cypress | Pendiente de medicion estable por entorno local |
| Cobertura backend JaCoCo | `22.87%` de lineas en la corrida actual |
| Cobertura frontend Vitest | `26.55%` global en la corrida actual |
| Estado de lint | `OK` con `npm run lint` |
| Estado de build frontend | `OK` con `npm run build` |
| Estado de CI | Compuertas backend y frontend configuradas |
| Issues Sonar | Pendiente de medicion |
| Bugs abiertos / cerrados | Pendiente de medicion en `ClickUp` |
| Criterio de aceptacion `v0.3.0` | backend y frontend validos, cobertura generada, calidad estatica ejecutable, sin cambios de negocio |

## Observaciones finales

- La fase mantiene un enfoque de medicion y reporte, no de endurecimiento agresivo por umbrales.
- `Sonar` queda preparado pero no obligatorio mientras no exista una configuracion externa estable.
- `Cypress` sigue como validacion local/manual hasta que su ejecucion sea repetible en todos los entornos.
- Las incidencias siguen registrandose en `ClickUp`, mientras que las evidencias tecnicas se centralizan en `qa/evidencias/`.

## Cierre QA v0.3.0

### Resumen de las 7 fases

- Fase 1: se establecio la base documental QA y la compuerta CI minima.
- Fase 2: se amplio la cobertura unitaria del backend.
- Fase 3: se implementaron pruebas de integracion backend con seguridad, persistencia y auditoria.
- Fase 4: se incorporaron pruebas frontend con `Vitest` y `React Testing Library`.
- Fase 5: se configuro `Cypress` para validacion `E2E` local/manual con estrategia hibrida.
- Fase 6: se formalizo la cobertura backend/frontend y la preparacion de `Sonar`.
- Fase 7: se consolida el cierre documental, la trazabilidad, el checklist de release y el control de cambios QA.

### Estado final

Estado recomendado para la version `v0.3.0`: **Aceptada con observaciones**.

Fundamento:

- backend y frontend cuentan con compuertas automatizadas verificables;
- la cobertura backend y frontend ya es medible y reportable;
- la trazabilidad funcional y documental queda consolidada;
- `Cypress` y las integraciones con `Testcontainers` siguen condicionadas al entorno y no deben presentarse como compuertas estables universales.

### Criterios de aceptacion de cierre

Para considerar listo el cierre QA de `v0.3.0` deben mantenerse:

- `mvn test` exitoso;
- `mvn test jacoco:report` exitoso;
- `npm run lint` exitoso;
- `npm test` exitoso;
- `npm run test:coverage` exitoso;
- `npm run build` exitoso;
- documentacion QA de cierre presente;
- evidencias y reportes generables desde comandos reproducibles;
- ausencia de secretos en archivos versionados de QA.

### Metricas QA consolidadas

| Metrica | Valor actual |
| --- | --- |
| Pruebas backend totales | `103` |
| Pruebas frontend totales | `29` |
| Specs Cypress configuradas | `5` |
| Cobertura backend JaCoCo | `22.87%` |
| Cobertura frontend Vitest | `26.55%` |
| Estado lint | Exitoso |
| Estado build | Exitoso |
| Estado CI | Workflow configurado para backend y frontend |
| Estado Sonar | Preparado, no obligatorio en CI |
| Bugs abiertos/cerrados | Pendiente de medicion |

### Pendientes posteriores a v0.3.0

- estabilizar por completo `Cypress` como compuerta repetible;
- habilitar entorno Docker valido para ejecucion completa de integracion backend;
- elevar cobertura de backend y frontend antes de imponer umbrales;
- activar `Sonar` en CI solo cuando existan secretos y entorno estable;
- evaluar una fase posterior para carga, rendimiento y seguridad ofensiva.
