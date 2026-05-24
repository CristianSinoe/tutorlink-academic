# QA TutorLink

Esta carpeta concentra la base documental y operativa de aseguramiento de calidad de TutorLink para la consolidacion de `v0.3.0`.

## Contenido

- `plan-pruebas.md`: estrategia, alcance, criterios y lineamientos de pruebas.
- `evidencias/`: estructura versionada para guardar salidas de herramientas, capturas y otros artefactos de validacion.

## Convencion de evidencias

- `evidencias/capturas/`: imagenes o evidencia visual manual.
- `evidencias/postman/`: colecciones, exports o resultados de pruebas API.
- `evidencias/cypress/`: reservado para Fase 2, cuando se incorpore `Cypress`.
- `evidencias/sonar/`: reservado para Fase 2, si se incorpora `SonarQube` o `SonarCloud`.
- `evidencias/jacoco/`: reservado para Fase 2, si se incorpora cobertura backend con `JaCoCo`.

## Alcance de la Fase 1

En esta fase se agrega:

- documentacion QA base;
- estructura versionada para evidencias;
- workflow CI con compuertas minimas de backend y frontend;
- correcciones no funcionales necesarias para que `npm run lint` pueda operar como compuerta.

Queda pendiente para fases posteriores:

- nuevas pruebas unitarias;
- pruebas de integracion;
- `Cypress`;
- `SonarQube` o `SonarCloud`;
- `JaCoCo`;
- `Testcontainers`;
- integracion API/E2E y evidencias automatizadas avanzadas.
