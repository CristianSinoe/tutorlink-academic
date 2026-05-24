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

## Observaciones finales

- Esta fase no agrega `Cypress`, `Sonar`, `JaCoCo` ni `Testcontainers`.
- Esta fase no introduce nuevas pruebas funcionales ni cambia endpoints.
- La correccion de lint se limita a limpieza estructural no funcional para habilitar la compuerta de calidad.
- Las incidencias siguen registrandose en `ClickUp`, mientras que las evidencias tecnicas se centralizan gradualmente en `qa/evidencias/`.
