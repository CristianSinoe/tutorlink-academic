# Evidencias JaCoCo

Esta carpeta documenta la evidencia academica de cobertura backend generada con `JaCoCo`.

## Que evidencia va aqui

- capturas del resumen HTML de cobertura;
- nota del porcentaje global observado;
- salida de consola de `mvn test jacoco:report`;
- referencia al XML tecnico si se necesita sustento para `Sonar`.

## Como generar el reporte

```bash
cd backend
mvn test jacoco:report
```

## Donde verlo

- HTML principal: `backend/target/site/jacoco/index.html`
- XML tecnico: `backend/target/site/jacoco/jacoco.xml`

## Que no debe versionarse

No se deben subir al repositorio:

- carpetas `target/` completas;
- HTML generado por `JaCoCo`;
- artefactos binarios de cobertura.

## Que se puede anexar a la entrega academica

- captura del dashboard HTML;
- captura del porcentaje global visible;
- salida resumida de consola;
- referencia al archivo XML cuando se explique integracion con `Sonar`.
