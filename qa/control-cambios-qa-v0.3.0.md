# Control de Cambios QA v0.3.0

| Fecha | Fase | Cambio realizado | Archivos principales | Responsable sugerido | Impacto | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| `2026-05-27` | Fase 1 | Base documental QA y compuerta CI inicial | `qa/plan-pruebas.md`, `qa/README.md`, `.github/workflows/quality-ci.yml` | Quetzalli Yatana Roa Moreno / Cristian Sinoe Hernandez Ruiz | Establece estructura y automatizacion minima | Completada |
| `2026-05-27` | Fase 2 | Ampliacion de pruebas unitarias backend | `backend/src/test/java/com/sinoe/authmfa/service/*.java` | Cristian Sinoe Hernandez Ruiz | Aumenta cobertura de reglas criticas | Completada |
| `2026-05-27` | Fase 3 | Pruebas de integracion backend con `MockMvc`, `Flyway` y `Testcontainers` | `backend/src/test/java/com/sinoe/authmfa/integration/`, `backend/src/test/resources/application-test.yml` | Cristian Sinoe Hernandez Ruiz / Quetzalli Yatana Roa Moreno | Valida controladores, seguridad, persistencia y auditoria | Parcial |
| `2026-05-27` | Fase 4 | Pruebas frontend con `Vitest` y `React Testing Library` | `frontend/src/test/`, `frontend/src/**/__tests__/`, `frontend/vite.config.js`, `frontend/package.json` | Benjamin Emmanuel Coello Trujillo | Introduce automatizacion frontend sin backend real | Completada |
| `2026-05-27` | Fase 5 | Configuracion `Cypress` y estrategia `E2E` local hibrida | `frontend/cypress/`, `frontend/cypress.config.js`, `qa/evidencias/cypress/README.md` | Benjamin Emmanuel Coello Trujillo / Quetzalli Yatana Roa Moreno | Habilita validacion E2E local/manual | Parcial |
| `2026-05-27` | Fase 6 | Cobertura backend/frontend y preparacion de `Sonar` | `backend/pom.xml`, `frontend/package.json`, `frontend/vite.config.js`, `sonar-project.properties`, `.github/workflows/quality-ci.yml` | Cristian Sinoe Hernandez Ruiz / Benjamin Emmanuel Coello Trujillo | Formaliza reportes de cobertura y calidad estatica | Completada |
| `2026-05-27` | Fase 7 | Cierre documental QA, matriz, checklist y control de release | `qa/informe-final-qa-v0.3.0.md`, `qa/matriz-trazabilidad-v0.3.0.md`, `qa/checklist-release-v0.3.0.md`, `qa/control-cambios-qa-v0.3.0.md`, `qa/README.md`, `qa/plan-pruebas.md` | Quetzalli Yatana Roa Moreno | Consolida evidencia academica y criterio de aceptacion para `v0.3.0` | Completada |

## Registro de commit

Los hashes concretos de commit para cada fase quedan como:

- `Pendiente de registrar commit`

Este documento se centra en la trazabilidad funcional y documental del cierre QA, no en reconstruir historial Git inexistente o no confirmado.
