# Evidencias Sonar

Esta carpeta documenta la preparacion y la evidencia controlada del analisis con `SonarQube` o `SonarCloud`.

## Que evidencia va aqui

- capturas del dashboard principal;
- capturas de bugs, vulnerabilidades, code smells y quality gate;
- exportaciones JSON de issues o metricas, si se generan manualmente;
- evidencia del consumo de `jacoco.xml` y `lcov.info`.

## Requisitos previos

Debe existir:

- `sonar-project.properties` en la raiz del repositorio;
- `sonar-scanner` instalado localmente o una ejecucion equivalente;
- variables de entorno locales cuando el servidor lo requiera.

## Como generar la evidencia

```bash
sonar-scanner
```

Si el entorno requiere autenticacion, las variables deben inyectarse fuera del repositorio, por ejemplo:

- `SONAR_TOKEN`
- `SONAR_HOST_URL`
- `SONAR_PROJECT_KEY`

## Que no debe versionarse

No se deben subir:

- tokens o credenciales;
- `.scannerwork/`;
- reportes temporales internos del escaner;
- capturas con informacion sensible del entorno.

## Que se puede anexar a la entrega academica

- captura del dashboard;
- captura del quality gate;
- captura o export de issues;
- referencia a `backend/target/site/jacoco/jacoco.xml`;
- referencia a `frontend/coverage/lcov.info`.
