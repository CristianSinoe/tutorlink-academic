# Reporte de Calidad Estática – SonarQube

## 1. Datos generales

- Proyecto: `TutorLink`
- Herramienta: `SonarQube`
- Versión objetivo: `v0.3.0`
- Fecha de análisis:
- Responsable del análisis:
- Ambiente de ejecución:
- URL del servidor SonarQube:
- Clave del proyecto en Sonar:

## 2. Propósito del reporte

El presente reporte documenta los resultados obtenidos del análisis estático de calidad realizado sobre `TutorLink` mediante `SonarQube`, con el fin de identificar defectos potenciales, vulnerabilidades, deuda técnica, duplicación y métricas globales de mantenibilidad, sirviendo como evidencia académica y técnica del estado de calidad del software.

## 3. Alcance del análisis

Indicar qué se analizó en esta corrida:

- Backend `Spring Boot`
- Frontend `React + Vite`
- Reportes de cobertura integrados:
  - `JaCoCo` backend
  - `Vitest coverage` frontend

## 4. Configuración utilizada

### 4.1 Archivos y reportes asociados

- Archivo de configuración: `sonar-project.properties`
- Cobertura backend: `backend/target/site/jacoco/jacoco.xml`
- Cobertura frontend: `frontend/coverage/lcov.info`

### 4.2 Exclusiones principales

- `**/node_modules/**`
- `**/target/**`
- `**/dist/**`
- `**/coverage/**`
- `**/.scannerwork/**`
- `**/cypress/videos/**`
- `**/cypress/screenshots/**`

## 5. Resumen ejecutivo

Completar con los resultados de la corrida:

| Métrica | Resultado |
| --- | --- |
| Quality Gate |  |
| Bugs |  |
| Vulnerabilidades |  |
| Code Smells |  |
| Hotspots de seguridad |  |
| Cobertura total |  |
| Duplicación |  |
| Líneas de código (`ncloc`) |  |
| Deuda técnica estimada |  |

## 6. Resultados principales

### 6.1 Calidad general

Describir brevemente:

- estado general del proyecto;
- severidad predominante de hallazgos;
- módulos más afectados;
- relación entre cobertura y calidad observada.

### 6.2 Hallazgos relevantes

Registrar los hallazgos más importantes:

| ID / Regla | Tipo | Severidad | Archivo / módulo | Descripción resumida | Estado |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

### 6.3 Observaciones por componente

#### Backend

- Cobertura:
- Principales riesgos detectados:
- Oportunidades de mejora:

#### Frontend

- Cobertura:
- Principales riesgos detectados:
- Oportunidades de mejora:

## 7. Evidencias

Adjuntar o referenciar:

- captura del dashboard principal;
- captura del `Quality Gate`;
- captura del panel de issues;
- captura del resumen de cobertura;
- exportes JSON, si aplica:
  - `sonar-issues.json`
  - `sonar-metrics.json`
  - `sonar-quality-gate.json`

## 8. Exportes recomendados por API

### 8.1 Issues

```bash
curl -s \
  -H "Authorization: Bearer $SONAR_TOKEN" \
  "http://localhost:9000/api/issues/search?componentKeys=tutorlink&resolved=false&ps=500" \
  > sonar-issues.json
```

### 8.2 Métricas

```bash
curl -s \
  -H "Authorization: Bearer $SONAR_TOKEN" \
  "http://localhost:9000/api/measures/component?component=tutorlink&metricKeys=coverage,bugs,vulnerabilities,code_smells,duplicated_lines_density,ncloc" \
  > sonar-metrics.json
```

### 8.3 Quality Gate

```bash
curl -s \
  -H "Authorization: Bearer $SONAR_TOKEN" \
  "http://localhost:9000/api/qualitygates/project_status?projectKey=tutorlink" \
  > sonar-quality-gate.json
```

## 9. Procedimiento sugerido para generar el reporte

### Backend

```bash
cd backend
mvn clean verify sonar:sonar \
  -Dsonar.projectKey=tutorlink \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login="$SONAR_TOKEN"
```

### Frontend

```bash
cd frontend
npm run test:coverage

cd ..
sonar-scanner \
  -Dsonar.projectKey=tutorlink \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login="$SONAR_TOKEN"
```

Nota:

- no registrar tokens reales en este documento;
- usar variables de entorno locales para autenticación;
- si se separan proyectos backend y frontend en Sonar, ajustar `projectKey` según corresponda.

## 10. Conclusiones

Redactar una conclusión breve sobre:

- nivel actual de calidad;
- criticidad de los hallazgos;
- preparación para liberación académica;
- necesidad o no de correcciones antes de cierre.

## 11. Recomendaciones

- priorizar corrección de issues críticos o altos;
- mejorar cobertura en módulos con alta complejidad y bajo nivel de prueba;
- repetir el análisis después de correcciones importantes;
- consolidar el `Quality Gate` como referencia para la entrega final.
