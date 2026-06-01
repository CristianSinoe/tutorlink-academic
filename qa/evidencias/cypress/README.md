# Evidencias Cypress

Esta carpeta documenta la evidencia academica de las pruebas `E2E` locales con `Cypress`.

## Que evidencia va aqui

- capturas de fallos o estados relevantes de las specs;
- videos generados por `Cypress` cuando aporten valor explicativo;
- notas cortas sobre la condicion de ejecucion local/manual;
- resumen de que la estrategia principal usa `cy.intercept()` y fixtures.

## Como generar la evidencia

Levanta primero el frontend:

```bash
cd frontend
npm run dev
```

Luego ejecuta `Cypress`:

```bash
cd frontend
npm run cy:run
```

Tambien puede abrirse en modo interactivo:

```bash
cd frontend
npm run cy:open
```

## Ubicacion de artefactos generados

- screenshots de fallos: `frontend/cypress/screenshots/`
- videos de ejecucion: `frontend/cypress/videos/`

## Que no debe versionarse

No se deben subir automaticamente:

- videos completos de ejecucion no seleccionados;
- screenshots masivas generadas por fallos de desarrollo;
- caches o artefactos temporales del runner.

## Que se puede anexar a la entrega academica

- 1 o 2 capturas representativas por flujo;
- videos cortos solo si ayudan a mostrar el recorrido;
- una nota aclarando que `Cypress` sigue siendo local/manual y no compuerta estable de CI para `v0.3.0`;
- una nota de limitacion si el entorno local condiciona la ejecucion.
