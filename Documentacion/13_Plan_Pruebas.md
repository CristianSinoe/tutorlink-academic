# Plan de Pruebas del Software

## Base tecnológica verificada

- Frontend: `React 19 + Vite 7.2.4`
- Backend: `Spring Boot 3.3.4` sobre `Java 17`
- Base de datos: `PostgreSQL`
- Persistencia y control de esquema: `JPA/Hibernate` + `Flyway`
- Seguridad: `Spring Security`, `JWT`, `OTP`, `reCAPTCHA`
- Gestión de incidencias: `ClickUp`

## Estado actual del proyecto y criterio de redacción

TutorLink se encuentra en una madurez incremental. El backend académico integrado ya fue validado con `mvn test`, con resultado `BUILD SUCCESS`, `25 tests` ejecutados, `0 failures`, `0 errors` y `1 skipped`. El frontend académico integrado fue validado con `npm run build` exitoso y `npm run lint` sin errores.

Por lo anterior, este plan distingue entre:

- capacidades **ya verificadas** en `v0.1.0` y `v0.2.0`;
- capacidades **propuestas** o **recomendadas** para consolidarse en la rama `yatana` y en la versión `v0.3.0`.

El objetivo es dejar una estrategia de calidad progresiva, técnica y defendible tanto a nivel académico como profesional, alineada con el estado real del repositorio.

## 1. Estrategia y Enfoque de las Pruebas

El propósito del presente plan es definir la estrategia de aseguramiento de calidad de `TutorLink`, combinando actividades de verificación estática y dinámica para comparar el comportamiento esperado del sistema contra los requisitos funcionales, no funcionales, reglas de negocio y criterios de aceptación.

### 1.1 Alcance

El alcance cubre los flujos principales observados en el código y en la arquitectura actual:

- autenticación con credenciales, `OTP` y `reCAPTCHA`;
- primer acceso y cambio de contraseña;
- gestión administrativa de usuarios;
- activación y desactivación de usuarios;
- importación de usuarios y asignaciones por `CSV`;
- asignación tutor-estudiante;
- creación y consulta de preguntas por el estudiante;
- respuesta, corrección, rechazo y reclasificación por el tutor;
- dashboards por rol;
- auditoría y controles de acceso por rol;
- consistencia de datos y migraciones `Flyway`.

### 1.2 Principios de diseño de pruebas

Las técnicas de diseño de pruebas a utilizar incluyen:

- **Valores límite**:
  - longitud mínima y máxima de contraseña;
  - longitud de nombre y apellidos;
  - códigos `OTP` de 6 dígitos;
  - edad mínima y máxima permitida en flujos que validen fecha de nacimiento;
  - paginación y tamaño de página en consultas.
- **Clases de equivalencia**:
  - correo válido / inválido;
  - estados de usuario válidos / inválidos;
  - roles permitidos / no permitidos;
  - token válido / expirado / consumido.
- **Tablas de decisión**:
  - login con combinación de credenciales correctas, `reCAPTCHA` válido, estado de usuario y `OTP`;
  - cambios de estado de usuario;
  - transición de estados de preguntas.
- **Pruebas basadas en riesgo**:
  - seguridad de sesión;
  - emisión y validación de `OTP`;
  - integridad de asignaciones tutor-estudiante;
  - historial de respuestas;
  - errores de configuración por ambiente;
  - exposición accidental de secretos.

### 1.3 Estructura mínima de los casos de prueba

Cada caso de prueba deberá documentarse con, como mínimo:

- identificador único;
- módulo o funcionalidad;
- objetivo;
- precondiciones;
- datos de entrada;
- flujo exacto paso a paso;
- resultado esperado;
- resultado obtenido;
- evidencia;
- estado final;
- identificador de incidencia en `ClickUp`, si aplica.

La estructura debe simular cargas de trabajo realistas:

- estudiantes autenticándose y registrando preguntas;
- tutores atendiendo pendientes, corrigiendo o rechazando;
- administradores creando usuarios, cambiando estados, importando `CSV` y asignando tutores;
- comportamiento del sistema ante datos inválidos, expiraciones, accesos no autorizados y errores de dependencias externas.

## 2. Pruebas estáticas

Las pruebas estáticas no requieren ejecutar el sistema completo. Su objetivo es detectar tempranamente problemas de calidad, mantenibilidad, seguridad, estilo, configuración y dependencias antes de que se manifiesten en tiempo de ejecución.

En TutorLink, este bloque permite fortalecer la base técnica de `v0.3.0` con un enfoque preventivo y alineado con buenas prácticas DevOps.

### 2.1 Objetivos

- detectar defectos de código antes de la ejecución;
- reducir deuda técnica y `code smells`;
- identificar duplicación y bajo nivel de mantenibilidad;
- revisar vulnerabilidades en dependencias y configuraciones;
- validar que el repositorio no exponga secretos ni artefactos temporales;
- controlar cobertura mínima y zonas críticas con baja protección de pruebas.

### 2.2 Actividades estáticas recomendadas

| Actividad | Alcance en TutorLink | Estado actual |
| --- | --- | --- |
| `ESLint` en frontend | calidad de componentes, hooks, rutas, formularios y utilidades React | ya disponible y ejecutable |
| `SonarQube` o `SonarCloud` | análisis backend y frontend para bugs, vulnerabilidades, smells y duplicación | se propone para `v0.3.0` |
| Revisión de `code smells` | servicios, controladores, páginas administrativas y utilidades compartidas | se recomienda |
| Revisión de duplicación | validaciones repetidas, mapeos, flujos de formularios y reglas de negocio | se recomienda |
| Análisis de dependencias | librerías `npm` y dependencias Maven críticas | se recomienda |
| `npm audit` | vulnerabilidades del frontend y cadena de dependencias JavaScript | se propone para `v0.3.0` |
| Revisión de configuración | `.env.example`, propiedades de seguridad, perfiles y rutas | parcialmente verificable hoy |
| Revisión de cobertura | `JaCoCo` backend y reporte de cobertura frontend con `Vitest` | se propone para `v0.3.0` |
| Revisión de Git y `.gitignore` | prevención de versionado de `node_modules`, `dist`, `target`, logs y secretos | verificable hoy |

### 2.3 Ejemplos aplicados a TutorLink

- detectar variables no usadas o props sin consumo en páginas administrativas como `UsersPage`, `StudentsPage`, `TutorsPage` o `AssignmentsPage`;
- validar que no existan secretos reales en `frontend/.env.example` y `backend/.env.example`, sino valores de ejemplo o placeholders controlados;
- detectar `code smells` en servicios backend como `AdminUserService`, `QaService`, `TutorStudentAssignmentService`, `JwtService` o `OtpService`;
- revisar endpoints críticos con baja cobertura, por ejemplo autenticación, cambio de estado de usuarios, asignación tutor-estudiante y respuesta de preguntas;
- verificar que `node_modules`, `frontend/dist`, `backend/target`, `logs` y `*.log` no estén versionados, conforme a `.gitignore`;
- revisar si existen reglas de seguridad o configuración con riesgo de exposición, como secretos JWT, tokens bootstrap o credenciales SMTP mal gestionadas;
- identificar duplicación de validaciones de formularios en módulos administrativos del frontend, para decidir si conviene extraer helpers reutilizables.

### 2.4 Criterios mínimos de revisión estática

- `npm run lint` debe finalizar sin errores;
- no deben existir secretos reales en archivos de ejemplo o en el repositorio;
- el análisis de dependencias no debe reportar vulnerabilidades altas o críticas abiertas para liberar;
- las carpetas y archivos temporales deben permanecer excluidos del control de versiones;
- los módulos críticos deben contar con medición de cobertura y plan de refuerzo si están por debajo del umbral definido.

## 3. Pruebas dinámicas

Las pruebas dinámicas sí ejecutan el software y validan su comportamiento real. En TutorLink, este bloque confirma que frontend, backend, seguridad, persistencia y reglas por rol operan correctamente en condiciones controladas y realistas.

### 3.1 Objetivos

- verificar el comportamiento observable del sistema;
- validar entradas, salidas, reglas de negocio y restricciones;
- confirmar integración entre capas;
- detectar regresiones;
- medir estabilidad de la solución bajo escenarios funcionales y no funcionales.

### 3.2 Tipos de pruebas dinámicas incluidos

- unitarias;
- de integración;
- de sistema;
- `E2E`;
- de aceptación;
- de regresión;
- de desempeño;
- piloto.

### 3.3 Relación con los niveles del presente plan

La estrategia dinámica de TutorLink se organiza en niveles complementarios:

- **unitarias** para validar servicios, componentes, utilidades y reglas aisladas;
- **pruebas de integración** para confirmar comunicación entre módulos, API, seguridad y base de datos;
- **pruebas de sistema** para validar TutorLink como plataforma completa;
- **pruebas `E2E`** para automatizar recorridos críticos desde la interfaz;
- **pruebas de aceptación** para contrastar requisitos con el resultado funcional;
- **pruebas de regresión** para proteger releases;
- **pruebas de desempeño** para revisar carga y tiempos de respuesta;
- **pruebas piloto** para una validación controlada previa a la liberación.

## 4. Niveles y Tipos de Pruebas a Ejecutar

### 4.1 Pruebas unitarias

#### Objetivo

Validar reglas de negocio y comportamiento aislado de componentes, servicios, validadores y utilidades, minimizando el costo de detección temprana de defectos.

#### Backend

Herramientas y enfoque:

- `JUnit 5`;
- `Mockito`;
- pruebas de servicios y reglas sin depender de infraestructura real;
- uso selectivo de `Spring Boot Test` solo cuando la colaboración entre beans justifique un contexto ligero.

Cobertura objetivo propuesta para `v0.3.0`:

- `AuthService` o flujos equivalentes de autenticación;
- `JwtService` y utilidades relacionadas con emisión, parseo y expiración de tokens;
- `UserService`;
- `QaService`;
- `AdminUserService`;
- servicios de asignación tutor-estudiante, especialmente `TutorStudentAssignmentService`;
- validadores como `AgeValidator` y políticas de credenciales;
- mappers como `QaMapper`;
- reglas de estados de preguntas y respuestas;
- emisión, expiración, consumo y reintento de tokens y `OTP`;
- flujos de seguridad vinculados con primer acceso, cambio de contraseña y control de perfil permitido.

Estado actual observable:

- ya existen pruebas backend para `JwtService`, `QaService`, `AdminUserService`, `AllowedProfileService`, `AdminCredentialPolicy`, `AdminProvisioningService` y `AgeValidator`;
- se recomienda ampliar la cobertura hacia flujos de autenticación, `OTP`, asignaciones y control de acceso.

#### Frontend

Herramientas y enfoque propuestos para `v0.3.0`:

- `Vitest`;
- `React Testing Library`;
- pruebas de componentes y lógica de presentación;
- pruebas de hooks, guards y helpers;
- validación de formularios sin necesidad de ejecutar el stack completo.

Cobertura objetivo:

- componentes críticos de autenticación;
- validación de formularios;
- helpers y utilidades;
- guards de rutas como `ProtectedRoute`, `StudentRoute`, `TutorRoute` y `AdminRoute`;
- comportamiento de `AuthContext` y `useAuth`;
- renderizado y estado de `LoginPage`, dashboards por rol y formularios críticos;
- manejo visual de carga, error y acceso denegado.

#### Casos unitarios sugeridos

| ID | Módulo | Caso propuesto | Resultado esperado |
| --- | --- | --- | --- |
| `UT-AUTH-01` | autenticación | login con datos válidos | genera flujo válido y prepara autenticación posterior |
| `UT-AUTH-02` | autenticación | rechazo por datos inválidos | no autentica y devuelve error controlado |
| `UT-STU-01` | estudiante | validación del formulario de pregunta | bloquea envío si faltan campos críticos |
| `UT-ADM-01` | administración | cambio de estado de usuario | aplica transición válida y registra resultado |
| `UT-TUT-01` | tutor | validación de respuesta de tutor | rechaza respuesta incompleta o inválida |

### 4.2 Pruebas de integración

#### Objetivo

Verificar la comunicación efectiva entre módulos reales o semirreales, incluyendo API, seguridad, persistencia, migraciones y consumo desde el frontend.

#### Backend

Herramientas propuestas para `v0.3.0`:

- `Spring Boot Test`;
- `MockMvc`;
- `Testcontainers` con `PostgreSQL`;
- `Flyway` ejecutándose sobre la base de prueba;
- datos semilla controlados por escenario.

Cobertura sugerida sobre endpoints reales de TutorLink:

- `POST /api/auth/login`
- `POST /api/auth/login/verify-otp`
- `GET /api/me`
- `POST /api/student/questions`
- `GET /api/tutor/questions/pending`
- `POST /api/tutor/questions/{id}/answer`
- `GET /api/admin/users`
- endpoints de asignación tutor-estudiante como `POST /api/admin/users/tutor-students/assign` y `GET /api/admin/users/tutor-students`

La validación debe incluir:

- filtros de seguridad;
- serialización y validación de payloads;
- escritura y lectura real en `PostgreSQL`;
- ejecución correcta de migraciones `Flyway`;
- control de acceso por rol y estados de usuario.

#### Frontend y capa API

En la capa frontend se propone validar:

- consumo de la API desde React con ambiente de prueba;
- uso de mocks controlados cuando el objetivo sea aislar UI o flujos específicos;
- comportamiento del cliente `Axios` y de `frontend/src/api/axiosClient.js`;
- propagación de tokens, errores `401/403`, redirecciones y refresco del estado de autenticación.

#### Casos de integración sugeridos

| ID | Alcance | Caso propuesto | Resultado esperado |
| --- | --- | --- | --- |
| `INT-AUTH-01` | auth + seguridad + BD | login y verificación OTP con usuario válido | retorna autenticación exitosa y acceso a `/api/me` |
| `INT-STU-01` | estudiante + API + BD | creación de pregunta y consulta posterior | persiste la pregunta y aparece en historial |
| `INT-TUT-01` | tutor + API + BD | listado de pendientes y respuesta a pregunta | la pregunta cambia de estado y queda trazada |
| `INT-ADM-01` | admin + API + BD | alta, activación o desactivación de usuario | el cambio queda persistido y visible en consulta |
| `INT-BD-01` | infraestructura + migraciones | arranque con `Flyway` y esquema esperado | migraciones completas y datos consistentes |

### 4.3 Pruebas de sistema

#### Objetivo

Validar TutorLink como sistema completo, considerando frontend, backend, seguridad, base de datos, roles y reglas transversales de negocio.

#### Escenarios de sistema prioritarios

- estudiante se autentica, crea una pregunta y consulta su historial;
- tutor revisa preguntas pendientes y responde;
- administrador crea usuarios y asigna tutor;
- administrador importa `CSV`;
- control de acceso por roles;
- manejo de sesión inválida o token expirado;
- flujo completo de pregunta desde creación hasta respuesta.

| ID | Escenario | Roles involucrados | Precondiciones | Flujo | Resultado esperado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| `SYS-01` | estudiante crea pregunta y consulta historial | estudiante | usuario activo, credenciales válidas, tutor asignado si aplica | login, validación `OTP`, ingreso al dashboard, registro de pregunta, consulta del historial | la pregunta queda guardada y visible con estado coherente | captura, video corto, log API |
| `SYS-02` | tutor responde pregunta pendiente | tutor | tutor autenticado, pregunta pendiente asignada | login, consulta de pendientes, apertura de detalle, respuesta | la respuesta se almacena y el estado de la pregunta cambia correctamente | captura, log, evidencia BD |
| `SYS-03` | administrador crea usuario y cambia estado | administrador | admin activo y autorizado | login, creación de usuario, consulta, activación o desactivación | el usuario queda persistido con estado correcto | captura, payload, respuesta API |
| `SYS-04` | administrador importa `CSV` | administrador | archivo válido y permisos habilitados | login, carga de archivo, validación e importación | registros procesados con resumen de éxito y errores | captura, archivo, log |
| `SYS-05` | asignación tutor-estudiante | administrador, tutor, estudiante | registros existentes y activos | asignación manual o importada, verificación desde vistas relacionadas | la relación queda persistida y visible en consultas | captura, log, evidencia BD |
| `SYS-06` | control de acceso por rol | estudiante, tutor, administrador | usuarios con roles distintos | intentar acceso cruzado a rutas y endpoints protegidos | el sistema bloquea acceso no autorizado y mantiene rutas permitidas | captura, respuesta `403/401` |
| `SYS-07` | sesión inválida o token expirado | cualquier rol | token manipulado o expirado | invocar recurso protegido con token no válido | el sistema rechaza la sesión y redirige o informa error controlado | captura, log seguridad |
| `SYS-08` | ciclo completo de pregunta | estudiante, tutor | usuarios válidos y relación activa | creación, consulta, respuesta y visualización del resultado | la pregunta atraviesa el flujo completo con trazabilidad | video corto, capturas, evidencia API |

### 4.4 Pruebas E2E

#### Objetivo

Automatizar recorridos críticos de negocio desde la interfaz del usuario final hasta la validación de resultados visibles, con foco especial en liberación de `v0.3.0`.

#### Herramienta principal propuesta

`Cypress` será la herramienta principal de pruebas `E2E` del frontend.

#### Estructura sugerida

```text
frontend/cypress/e2e/auth.cy.js
frontend/cypress/e2e/student.cy.js
frontend/cypress/e2e/tutor.cy.js
frontend/cypress/e2e/admin.cy.js
frontend/cypress/e2e/access-control.cy.js
```

#### Escenarios `E2E` prioritarios

- login correcto;
- login inválido;
- protección de rutas;
- redirección por rol;
- estudiante crea pregunta;
- tutor responde pregunta;
- administrador gestiona usuarios;
- administrador asigna tutor-estudiante;
- `logout`.

#### Comandos sugeridos

```bash
npm install cypress --save-dev
npx cypress open
npx cypress run
```

#### Criterio de liberación

Los flujos críticos `E2E` deberán pasar antes de liberar `v0.3.0`, especialmente autenticación, rutas protegidas, pregunta del estudiante, respuesta del tutor y gestión administrativa esencial.

### 4.5 Pruebas de Interfaz Gráfica (UI)

#### Objetivo

Validar navegación, usabilidad, mensajes, estados visuales y restricciones de interacción en React.

#### Alcance

- bloqueo de envío si faltan campos obligatorios;
- validación de correo en login;
- navegación protegida por rol;
- mensajes de error visibles y comprensibles;
- botones deshabilitados durante operaciones de guardado;
- restricción de formularios incompletos;
- consistencia visual entre admin, estudiante y tutor.

Ejemplos reales aplicables a TutorLink:

- impedir enviar login sin `reCAPTCHA`;
- impedir crear pregunta sin título o descripción;
- verificar redirección correcta según rol tras autenticación;
- asegurar que el `logout` invalide estado local y navegación protegida;
- comprobar que formularios administrativos muestren validaciones legibles para nombres, apellidos, correo y matrícula.

### 4.6 Pruebas de Integridad de BD

#### Objetivo

Validar consistencia, restricciones, concurrencia e integridad de los datos en `PostgreSQL`.

#### Alcance

- unicidad de correo, matrícula y código de tutor;
- integridad de relaciones usuario-estudiante, usuario-tutor y tutor-estudiante;
- comportamiento de reasignación de estudiantes;
- inserción y lectura de preguntas, respuestas, `OTP` y auditoría;
- bloqueo o conflicto ante actualizaciones concurrentes de asignación;
- validación de migraciones `Flyway`.

### 4.7 Pruebas de Desempeño (Carga y Estrés)

#### Objetivo

Validar tiempos de respuesta y comportamiento bajo carga.

#### Herramienta sugerida

- `Apache JMeter`

#### Escenarios mínimos

- múltiples estudiantes autenticándose en paralelo;
- múltiples estudiantes creando preguntas;
- múltiples tutores consultando pendientes e historial;
- consultas administrativas concurrentes;
- estrés sobre envío de `OTP` y lectura de auditoría.

### 4.8 Pruebas de Aceptación

#### Objetivo

Verificar cumplimiento del Documento de Alcance, del SRS y de los compromisos funcionales esperados por los usuarios del sistema.

#### Formato sugerido

Se recomienda documentar en formato tipo `Gherkin` o tabla de aceptación.

Ejemplo base:

> Dado que soy un estudiante autenticado
> Cuando registro una pregunta con título, materia y descripción
> Entonces el sistema debe guardarla y mostrarla en mi historial

#### Escenarios de aceptación sugeridos

| ID | Escenario de aceptación | Criterio esperado |
| --- | --- | --- |
| `ACC-AUTH-01` | login seguro | solo usuarios válidos, activos y con verificación correspondiente acceden al sistema |
| `ACC-STU-01` | registro de pregunta | la pregunta se guarda y queda visible en historial del estudiante |
| `ACC-TUT-01` | respuesta de tutor | la respuesta queda asociada a la pregunta correcta y visible según el flujo |
| `ACC-ADM-01` | gestión de usuarios | el administrador puede crear, listar y cambiar estado de usuarios autorizados |
| `ACC-ADM-02` | asignación tutor-estudiante | la relación queda registrada y disponible para las vistas relacionadas |
| `ACC-SEG-01` | protección por rol | ningún usuario puede acceder a módulos ajenos a su perfil |

### 4.9 Pruebas Piloto

#### Objetivo

Ejecutar el sistema en un entorno de `staging` o validación controlada sin afectar operaciones reales.

#### Alcance

- usuarios piloto de tipo administrador, tutor y estudiante;
- validación de experiencia real de uso;
- detección temprana de defectos antes de producción;
- confirmación de configuraciones por ambiente.

### 4.10 Pruebas de Regresión

#### Objetivo

Asegurar que parches y correcciones no rompan funcionalidades previamente estables.

#### Alcance mínimo por cada release

- login y `OTP`;
- navegación por rol;
- creación y consulta de preguntas;
- atención por tutor;
- gestión de usuarios;
- asignaciones;
- endpoints críticos de API.

## 5. Matriz de trazabilidad

La matriz de trazabilidad relaciona funcionalidades de TutorLink con sus evidencias de validación en distintos niveles, facilitando defensa académica, auditoría de calidad y criterio de liberación.

| Requisito / Funcionalidad | Caso unitario | Caso integración | Caso sistema | Caso E2E | Caso aceptación | Evidencia esperada | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `RF-AUTH` Login y `OTP` | `UT-AUTH-01`, `UT-AUTH-02` | `INT-AUTH-01` | `SYS-01`, `SYS-07` | `E2E-AUTH-01`, `E2E-AUTH-02` | `ACC-AUTH-01` | capturas, logs, reporte `Cypress`, respuesta API | propuesto `v0.3.0` |
| `RF-STU` Crear pregunta | `UT-STU-01` | `INT-STU-01` | `SYS-01`, `SYS-08` | `E2E-STU-01` | `ACC-STU-01` | video corto, payload, evidencia BD | propuesto `v0.3.0` |
| `RF-TUT` Responder pregunta | `UT-TUT-01` | `INT-TUT-01` | `SYS-02`, `SYS-08` | `E2E-TUT-01` | `ACC-TUT-01` | captura, logs, transición de estado | propuesto `v0.3.0` |
| `RF-ADM` Gestión de usuarios | `UT-ADM-01` | `INT-ADM-01` | `SYS-03` | `E2E-ADM-01` | `ACC-ADM-01` | capturas, respuestas API, evidencia de auditoría | parcial actual / expansión `v0.3.0` |
| `RF-ADM` Asignación tutor-estudiante | `UT-ADM-02` | `INT-ADM-02` | `SYS-05` | `E2E-ADM-02` | `ACC-ADM-02` | evidencia BD, captura y log | propuesto `v0.3.0` |
| `RNF-SEG` Control de acceso | `UT-SEG-01` | `INT-SEG-01` | `SYS-06`, `SYS-07` | `E2E-SEG-01` | `ACC-SEG-01` | respuesta `401/403`, redirecciones y log seguridad | propuesto `v0.3.0` |
| `RNF-CAL` Calidad estática | `UT-CAL-01` si aplica | n/a | revisión transversal | validación previa a `E2E` | aceptación técnica interna | `ESLint`, `npm audit`, `Sonar`, cobertura, `.gitignore` | parcial actual / expansión `v0.3.0` |

## 6. Estrategia CI/CD y automatización de calidad

Para la rama `yatana` y la versión `v0.3.0`, se propone incorporar validaciones automatizadas mediante `GitHub Actions`, con el fin de convertir el plan de pruebas en una compuerta técnica de liberación.

### 6.1 Workflows sugeridos

#### `backend-ci.yml`

- configurar `Java 17`;
- restaurar caché Maven si aplica;
- ejecutar `mvn test`.

#### `frontend-ci.yml`

- configurar `Node.js`;
- ejecutar `npm ci`;
- ejecutar `npm run build`;
- ejecutar `npm run lint`.

#### `qa-e2e.yml`

- levantar entorno de prueba;
- iniciar frontend y backend con configuración controlada;
- ejecutar `Cypress`;
- subir evidencias y `artifacts`.

#### `sonar.yml`

- ejecutar análisis estático con `SonarCloud` o `SonarQube`, si se incorpora en `v0.3.0`;
- publicar métricas de bugs, vulnerabilidades, duplicación y mantenibilidad.

### 6.2 Criterios automáticos de compuerta

- no se libera si fallan los tests backend;
- no se libera si falla el build del frontend;
- no se libera si `lint` reporta errores;
- no se libera si falla un flujo `E2E` crítico;
- no se libera si existen vulnerabilidades altas o críticas abiertas en el bloque de calidad definido para la release.

## Estrategia de madurez por releases

### `v0.1.0` Backend académico

- backend integrado;
- pruebas unitarias backend iniciales;
- `mvn test` exitoso.

### `v0.2.0` Frontend académico

- frontend integrado;
- `npm run build` exitoso;
- `npm run lint` sin errores.

### `v0.3.0` QA y pruebas

- incorporación de `Cypress`;
- pruebas de integración;
- pruebas de sistema;
- pruebas de aceptación;
- matriz de trazabilidad;
- CI/CD;
- evidencias organizadas.

### `v1.0.0` Entrega final

- backend + frontend + QA consolidados;
- documentación final;
- criterios de aceptación cumplidos;
- release respaldada por evidencias y trazabilidad.

## 8. Criterios de entrada y salida

### 8.1 Criterios de entrada

| Criterio de entrada | Aplicación en TutorLink |
| --- | --- |
| backend y frontend integrados | ambos módulos deben compilar o iniciar según el alcance de la prueba |
| base de datos disponible | `PostgreSQL` accesible para pruebas manuales, integración o `Testcontainers` |
| usuarios de prueba definidos | estudiante, tutor y administrador con datos conocidos |
| ambiente local o `staging` preparado | variables de entorno, puertos y servicios listos |
| `.env.example` sin secretos | solo placeholders y valores de ejemplo controlados |
| datos `seed` disponibles | registros mínimos para autenticar, asignar y consultar |

### 8.2 Criterios de salida

| Criterio de salida | Condición esperada |
| --- | --- |
| pruebas críticas ejecutadas | cobertura de los flujos prioritarios definidos |
| bugs críticos en `0` | sin defectos bloqueantes o críticos abiertos |
| build y lint correctos | `mvn test`, `npm run build` y `npm run lint` según alcance |
| cobertura mínima definida | cumplimiento del umbral aprobado para release |
| evidencias capturadas | capturas, logs, reportes y artefactos organizados |
| trazabilidad actualizada | matriz alineada con los casos ejecutados |
| release aprobada | validación final del equipo responsable |

## 9. Asignación de roles para las pruebas

| Rol | Responsabilidad en pruebas |
| --- | --- |
| Analistas | planificación de la estrategia, diseño lógico de casos, criterios de aceptación y trazabilidad con requisitos |
| QA Lead / Test Manager | gobierno del plan, priorización por riesgo, seguimiento de cobertura, métricas y liberación |
| DevOps / Responsable CI | automatización de pipelines, compuertas técnicas, `artifacts` y soporte de ambientes |
| Auxiliares de Pruebas / Equipo Técnico | ejecución manual y dinámica, reprocesos, documentación de evidencia y registro de bugs en `ClickUp` |
| Desarrolladores Frontend | ejecución y mantenimiento de pruebas unitarias del frontend, `E2E` y soporte a corrección de defectos |
| Desarrolladores Backend | ejecución y mantenimiento de pruebas unitarias e integración del backend |
| DBA / Responsable de Datos | validación de integridad, concurrencia, datos de prueba y restauración |
| Cliente / Usuarios piloto | ejecución de validación funcional y piloto, confirmación de aceptación y reporte oficial de fallas |
| Project Manager | seguimiento del avance de pruebas, escalamiento de riesgos y control de hitos de liberación |

## 10. Herramientas y gestión de incidencias

### 10.1 Soporte automatizado

Herramientas recomendadas integrables con `VS Code`, `Git` y pipelines:

- Frontend:
  - `ESLint`
  - `Vitest`
  - `React Testing Library`
  - `Cypress`
- Backend:
  - `JUnit 5`
  - `Mockito`
  - `Spring Boot Test`
  - `MockMvc`
  - `Testcontainers`
- API / Integración:
  - `Postman`
  - `Newman`
- Desempeño:
  - `JMeter`
- Cobertura:
  - `JaCoCo` para backend
  - cobertura nativa de `Vitest` para frontend
- Calidad estática:
  - `SonarQube` o `SonarCloud`
  - `npm audit`

Nota de madurez:

- `ESLint`, `mvn test`, `npm run build` y `npm run lint` están alineados con el estado actual;
- `Vitest`, `Cypress`, `JaCoCo`, `Sonar` y `Testcontainers` se recomiendan como incorporación formal en `v0.3.0`.

### 10.2 Flujo de incidencias en ClickUp

Todo bug deberá registrarse en `ClickUp` con el siguiente estándar mínimo:

- **Título:** breve, preciso y orientado al síntoma.
- **Módulo:** autenticación, admin, estudiante, tutor, BD, integración, seguridad, `E2E`, etc.
- **Pasos para reproducir:** secuencia exacta y numerada.
- **Comportamiento actual:** resultado observado.
- **Comportamiento esperado:** resultado correcto esperado.
- **Severidad:** bloqueante, crítica, alta, media o baja.
- **Ambiente:** desarrollo, QA, `staging` o producción.
- **Evidencia:** captura, log, payload, video o query.
- **Versión detectada:** build o release.

Flujo sugerido:

`Nuevo -> En Análisis -> Asignado -> En Desarrollo -> En QA -> Cerrado`

Estados alternos:

- `Reabierto`
- `Duplicado`
- `Rechazado`
- `Diferido`

### 10.3 Formato de control de ejecución

La siguiente tabla puede usarse como plantilla de revisión funcional o de ejecución de campañas de prueba.

| ID Caso | Módulo | Requisito asociado | Precondiciones | Datos de entrada | Pasos | Resultado esperado | Resultado obtenido | Estado (`OK` / `FALLA`) | Evidencia | ID Bug ClickUp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |

## 11. Evidencias de prueba

La evidencia debe ser suficiente para reproducibilidad, defensa académica y soporte de liberación.

### 11.1 Tipos de evidencia

- capturas de pantalla;
- videos cortos;
- logs;
- reportes de `Cypress`;
- reportes de `JaCoCo`;
- reportes de `Sonar`;
- salida de consola;
- export de `Postman` o `Newman`;
- archivos de incidencias `Jira` o `ClickUp`, según el flujo adoptado.

### 11.2 Estructura sugerida

```text
qa/evidencias/
qa/evidencias/cypress/
qa/evidencias/sonar/
qa/evidencias/jacoco/
qa/evidencias/postman/
qa/evidencias/capturas/
```

## 12. Métricas de calidad y criterios absolutos de aceptación

### 12.1 Métricas

| Métrica | Fórmula / Criterio |
| --- | --- |
| Densidad de defectos | `Defectos confirmados / módulo o componente evaluado` |
| Tasa de defectos críticos | `Defectos críticos / defectos totales * 100` |
| Cobertura de pruebas backend | `Líneas o ramas cubiertas / total medido * 100` |
| Cobertura de pruebas frontend | `Componentes críticos cubiertos / total crítico * 100` |
| Tasa de reapertura | `Bugs reabiertos / bugs cerrados * 100` |
| Efectividad de pruebas | `Bugs detectados en QA / bugs totales detectados antes de producción * 100` |
| Estabilidad de release | `Casos de regresión exitosos / casos de regresión ejecutados * 100` |

### 12.2 Criterios de aceptación release

Una liberación será aprobada únicamente si cumple simultáneamente:

- `0` errores bloqueantes;
- `0` errores críticos;
- máximo `3` errores funcionales mayores abiertos, siempre que no afecten autenticación, asignaciones, preguntas ni seguridad;
- máximo `5` errores funcionales menores;
- máximo `10` errores de UI menores que no afecten la operación;
- `100%` de ejecución de casos de prueba críticos;
- `100%` de validación de login, `OTP`, administración, asignaciones y preguntas;
- cobertura mínima recomendada:
  - backend crítico: `>= 80%`
  - frontend crítico: `>= 70%`
- `0` vulnerabilidades altas o críticas conocidas antes del pase.

## 13. Plan de implementación QA en rama yatana

Se propone la siguiente secuencia de trabajo incremental para materializar este plan en la rama `yatana`:

```text
docs(qa): add testing strategy and scope
docs(qa): add test levels and traceability matrix
test(backend): expand unit coverage for core services
test(integration): add API integration tests
test(e2e): scaffold Cypress for TutorLink
test(e2e): cover authentication and protected routes
test(e2e): cover student question workflow
test(e2e): cover tutor answer workflow
test(e2e): cover admin management workflow
ci(quality): add backend and frontend validation workflows
docs(qa): add evidence checklist and release criteria
```

Flujo sugerido de promoción:

`yatana -> develop -> release -> main -> tag v0.3.0`

## Observaciones finales

- Se corrige el uso terminológico priorizando **pruebas de integración** en lugar de “pruebas integrales”, reservando “pruebas de sistema” como nivel distinto.
- Se distingue expresamente entre **pruebas de aceptación** y **pruebas piloto**.
- El plan mantiene una línea realista: no afirma como implementado lo que hoy aún está propuesto para `v0.3.0`.
- Las incidencias seguirán registrándose en `ClickUp`, mientras que las evidencias técnicas podrán almacenarse en la estructura `qa/evidencias/`.
