# QA TutorLink

Esta carpeta concentra el cierre documental y operativo de aseguramiento de calidad de TutorLink para la version `v0.3.0`.

## Indice QA

- `plan-pruebas.md`: estrategia general, fases, criterios y cierre QA.
- `informe-final-qa-v0.3.0.md`: informe final academico y tecnico de aseguramiento de calidad.
- `matriz-trazabilidad-v0.3.0.md`: relacion entre requisitos, casos de uso, reglas de negocio, pruebas y evidencias.
- `checklist-release-v0.3.0.md`: checklist operativo de liberacion.
- `control-cambios-qa-v0.3.0.md`: consolidado de cambios QA por fase.
- `evidencias/`: instrucciones para capturas, reportes y salidas generadas.

## Evidencias disponibles

- `evidencias/capturas/`: evidencia visual manual controlada.
- `evidencias/postman/`: colecciones o resultados API, si se usan posteriormente.
- `evidencias/cypress/README.md`: ejecucion local/manual de `Cypress` y artefactos asociados.
- `evidencias/jacoco/README.md`: generacion y resguardo de cobertura backend.
- `evidencias/frontend-coverage/README.md`: generacion y resguardo de cobertura frontend.
- `evidencias/sonar/README.md`: preparacion y evidencia de analisis `Sonar`.

## Comandos de ejecucion

### Backend

```bash
cd backend
mvn test
mvn test jacoco:report
```

### Frontend

```bash
cd frontend
npm run lint
npm test
npm run test:coverage
npm run build
```

### Cypress local

```bash
cd frontend
npm run dev
```

En otra terminal:

```bash
cd frontend
npm run cy:run
```

### Sonar local

```bash
sonar-scanner
```

## Interpretacion rapida de resultados

- `mvn test`: valida la base unitaria backend y refleja el estado de las suites de integracion; en este entorno las de `Testcontainers` pueden quedar omitidas.
- `mvn test jacoco:report`: genera reporte HTML y XML de cobertura backend.
- `npm run lint`: valida calidad estatica del frontend.
- `npm test`: ejecuta pruebas frontend con `Vitest`.
- `npm run test:coverage`: genera cobertura frontend y reportes HTML/LCOV.
- `npm run build`: confirma que el frontend compila correctamente para release.
- `npm run cy:run`: se mantiene como validacion local/manual, no como compuerta estable de CI.

## Que no debe versionarse

No deben subirse al repositorio:

- `target/`
- `dist/`
- `coverage/`
- `.scannerwork/`
- `frontend/cypress/videos/`
- `frontend/cypress/screenshots/`
- archivos `.env` reales
- tokens o credenciales de `Sonar`

## Estado consolidado de fases

- Fase 1: base documental QA y CI minima.
- Fase 2: pruebas unitarias backend.
- Fase 3: pruebas de integracion backend preparadas y ejecutables con dependencia de Docker.
- Fase 4: pruebas frontend con `Vitest` y `React Testing Library`.
- Fase 5: `Cypress` local con estrategia hibrida.
- Fase 6: cobertura backend/frontend y preparacion de `Sonar`.
- Fase 7: cierre documental QA, trazabilidad y checklist de release.
