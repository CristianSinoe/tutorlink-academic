# Evidencias cobertura frontend

Este directorio documenta la generacion y resguardo de evidencias de cobertura frontend con `Vitest`.

## Como generar el reporte

```bash
cd frontend
npm run test:coverage
```

## Ubicacion del reporte generado

- HTML principal: `frontend/coverage/index.html`
- LCOV: `frontend/coverage/lcov.info`

## Que adjuntar como evidencia academica

- captura del resumen HTML de cobertura;
- captura del porcentaje global mostrado por Vitest;
- archivo `lcov.info` si se requiere soporte tecnico;
- salida de consola de `npm run test:coverage`.

## Nota

La carpeta `frontend/coverage/` no debe versionarse. Solo se versionan estas instrucciones y la estructura de evidencias.
