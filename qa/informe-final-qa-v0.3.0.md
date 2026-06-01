# Informe Final QA v0.3.0

## 1. Portada tecnica

- Proyecto: TutorLink
- Version QA: `v0.3.0`
- Rama evaluada: `yatana`
- Fecha de cierre: `2026-05-27`
- Responsable QA: Quetzalli Yatana Roa Moreno
- Coordinacion tecnica / backend: Cristian Sinoe Hernandez Ruiz
- Frontend: Benjamin Emmanuel Coello Trujillo
- Contexto academico: cierre documental y tecnico de aseguramiento de calidad para liberacion academica controlada

## 2. Resumen ejecutivo QA

TutorLink fue validado mediante una estrategia incremental de siete fases que abarco compuertas CI, pruebas unitarias backend, pruebas de integracion backend, pruebas frontend con `Vitest` y `React Testing Library`, preparacion E2E con `Cypress`, medicion formal de cobertura y preparacion de analisis estatico con `SonarQube` o `SonarCloud`.

El sistema presenta un estado funcional verificable en backend y frontend. Las compuertas tecnicas principales ejecutadas para este cierre fueron satisfactorias: `mvn test`, `mvn test jacoco:report`, `npm run lint`, `npm test`, `npm run test:coverage` y `npm run build`. La automatizacion E2E con `Cypress` queda preparada y documentada, pero no se presenta como compuerta estable de release debido a su dependencia del entorno local y a la inestabilidad previa observada en el runtime del binario.

El alcance real de automatizacion en `v0.3.0` es suficiente para sostener una recomendacion de release academico con observaciones, no una aceptacion plena sin reservas.

## 3. Alcance de QA

La validacion realizada cubre:

- backend con `Spring Boot`, servicios, controladores, seguridad y auditoria;
- frontend `React + Vite` con validacion visual y comportamental por rol;
- autenticacion con `JWT`, `OTP` y tratamiento de `reCAPTCHA` en pruebas;
- roles de estudiante, tutor y administrador;
- flujo de preguntas, respuestas, historial y administracion basica;
- control de acceso y rutas protegidas;
- cobertura formal backend con `JaCoCo`;
- cobertura frontend con `Vitest`;
- compuertas CI en `GitHub Actions`;
- documentacion y estructura de evidencias QA.

## 4. Fuera de alcance

Quedan fuera del cierre QA de `v0.3.0`:

- despliegue productivo final;
- pruebas de carga o rendimiento avanzado;
- pruebas de seguridad ofensiva profunda;
- integracion real con correo `SMTP` productivo;
- uso de `reCAPTCHA` real dentro de la compuerta `E2E`;
- integracion de `Cypress` en CI;
- analisis `Sonar` ejecutado con token real dentro del workflow.

## 5. Estrategia de pruebas aplicada

La estrategia consolidada en el repositorio quedo compuesta por:

- pruebas estaticas con `ESLint` y revision de artefactos versionables;
- pruebas unitarias backend con `JUnit 5` y `Mockito`;
- pruebas de integracion backend con `Spring Boot Test`, `MockMvc`, `Flyway` y `Testcontainers`;
- pruebas frontend con `Vitest`, `jsdom` y `React Testing Library`;
- pruebas `E2E` locales con `Cypress` bajo estrategia hibrida con `cy.intercept()`;
- cobertura backend con `JaCoCo`;
- cobertura frontend con `Vitest coverage`;
- preparacion de `SonarQube` o `SonarCloud` mediante `sonar-project.properties`;
- compuertas CI separadas para backend y frontend.

## 6. Resultados por fase

| Fase | Objetivo | Herramienta principal | Resultado | Evidencia / archivo | Estado |
| --- | --- | --- | --- | --- | --- |
| 1 | Base documental QA y CI | `GitHub Actions`, documentacion QA | Se incorporo plan de pruebas, README QA y workflow unificado | `qa/plan-pruebas.md`, `qa/README.md`, `.github/workflows/quality-ci.yml` | Completada |
| 2 | Pruebas unitarias backend | `JUnit 5`, `Mockito` | Se ampliaron pruebas de servicios criticos | `backend/src/test/java/com/sinoe/authmfa/service/` | Completada |
| 3 | Integracion backend | `Spring Boot Test`, `MockMvc`, `Testcontainers` | Se implementaron suites de integracion y seguridad; en este entorno quedan omitidas por falta de Docker valido | `backend/src/test/java/com/sinoe/authmfa/integration/` | Parcial |
| 4 | Pruebas frontend automatizadas | `Vitest`, `React Testing Library` | Se cubrieron login, OTP, estudiante, tutor, admin y guardas de rutas | `frontend/src/**/__tests__/` | Completada |
| 5 | E2E local | `Cypress` | Se configuraron specs, fixtures y comandos; no queda como compuerta estable | `frontend/cypress/`, `qa/evidencias/cypress/README.md` | Parcial |
| 6 | Cobertura y calidad estatica | `JaCoCo`, `Vitest coverage`, `Sonar` preparado | Se generan reportes de cobertura y configuracion local de Sonar sin secretos | `backend/target/site/jacoco/`, `frontend/coverage/`, `sonar-project.properties` | Completada |
| 7 | Cierre QA y release | Documentacion QA | Se consolidan trazabilidad, checklist, control de cambios e informe final | `qa/informe-final-qa-v0.3.0.md`, `qa/matriz-trazabilidad-v0.3.0.md`, `qa/checklist-release-v0.3.0.md`, `qa/control-cambios-qa-v0.3.0.md` | Completada |

## 7. Resultados de ejecucion

### Backend

```bash
cd backend
mvn test
```

Resultado real resumido:

- `BUILD SUCCESS`
- `Tests run: 103`
- `Failures: 0`
- `Errors: 0`
- `Skipped: 30`

Observacion: los `30 skipped` corresponden al bloque de integracion que usa `Testcontainers`, omitido en este entorno al no encontrarse un entorno Docker valido.

```bash
cd backend
mvn test jacoco:report
```

Resultado real resumido:

- `BUILD SUCCESS`
- reporte generado en `backend/target/site/jacoco/index.html`
- reporte XML generado en `backend/target/site/jacoco/jacoco.xml`

### Frontend

```bash
cd frontend
npm run lint
```

Resultado real resumido:

- ejecucion exitosa, sin errores reportados por `ESLint`

```bash
cd frontend
npm test
```

Resultado real resumido:

- `9` archivos de prueba
- `29` pruebas
- todas en verde

```bash
cd frontend
npm run test:coverage
```

Resultado real resumido:

- ejecucion exitosa
- `9` archivos de prueba
- `29` pruebas
- cobertura global visible en consola y reportes

```bash
cd frontend
npm run build
```

Resultado real resumido:

- build exitoso con `Vite`

### Cypress

```bash
cd frontend
npm run cy:run
```

Estado documentado para este cierre:

- no se usa como compuerta obligatoria de Fase 7;
- la suite queda configurada y documentada para ejecucion local/manual;
- su repetibilidad sigue condicionada al entorno local, al frontend levantado y a la estabilidad del runtime/binario de `Cypress`.

## 8. Metricas QA

| Metrica | Valor / estado |
| --- | --- |
| Total de pruebas backend | `103` |
| Total de pruebas frontend | `29` |
| Total de pruebas Cypress | No disponible como metrica consolidada en esta fase |
| Specs Cypress configuradas | `5` |
| Cobertura backend JaCoCo | `22.87%` lineas |
| Cobertura frontend Vitest | `26.55%` global |
| Estado lint | Exitoso |
| Estado build frontend | Exitoso |
| Estado workflow CI | Configurado con compuertas backend y frontend |
| Estado Sonar | Preparado localmente, no ejecutado como compuerta obligatoria |
| Incidencias abiertas | Pendiente de medicion |
| Incidencias cerradas | Pendiente de medicion |
| Limitaciones | `Cypress` local/manual, `Testcontainers` dependiente de Docker, cobertura inicial mejorable |

## 9. Riesgos y limitaciones detectadas

- El flujo `OTP` y `reCAPTCHA` real no forma parte de una compuerta `E2E` totalmente estable.
- Las pruebas de integracion backend con `Testcontainers` dependen de un entorno Docker valido; en este entorno quedaron omitidas.
- `Cypress` se mantiene como ejecucion local/manual y no entra todavia a CI.
- La cobertura inicial, tanto backend como frontend, es medible pero aun mejorable antes de endurecer umbrales.
- El analisis `Sonar` requiere configuracion local adicional y token fuera del repositorio.
- La liberacion academica no equivale a un despliegue productivo endurecido con correo, seguridad ofensiva y carga avanzada.

## 10. Conclusion QA

La version `v0.3.0` de TutorLink queda **Aceptada con observaciones**.

Motivos principales:

- backend y frontend cuentan con compuertas tecnicas reales y repetibles;
- existe evidencia automatizada de pruebas unitarias, integracion preparada, pruebas frontend, cobertura y CI;
- la trazabilidad funcional y documental queda consolidada para revision academica;
- permanecen observaciones relevantes sobre estabilidad E2E local, dependencia de Docker para integracion completa y cobertura todavia inicial.

La recomendacion es avanzar a revision de release academico con seguimiento posterior sobre:

- estabilizacion total de `Cypress`;
- disponibilidad de Docker para integracion backend completa;
- incremento progresivo de cobertura;
- activacion futura de `Sonar` con secretos controlados.
