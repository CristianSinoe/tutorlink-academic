# Guia de Ejecucion de Pruebas TutorLink

## Objetivo

Este documento resume como ejecutar las pruebas de TutorLink de forma manual, indicando:

- que debes tener listo antes de empezar;
- en que carpeta debes estar;
- que comando ejecutar;
- cuando necesitas abrir otra terminal;
- que resultados deberias esperar.

## 1. Antes de ejecutar cualquier prueba

## 1.1 Ubicacion del proyecto

Asume que el repositorio esta en:

```bash
~/TUTORLINK
```

Si no estas ahi, primero entra a la raiz:

```bash
cd ~/TUTORLINK
```

## 1.2 Herramientas necesarias

Debes tener instalado al menos:

- `Java 17`
- `Maven`
- `Node.js`
- `npm`

Para validar versiones:

```bash
java -version
mvn -version
node -v
npm -v
```

## 1.3 Dependencias del proyecto

Si es la primera vez que trabajas con el frontend, instala dependencias:

```bash
cd ~/TUTORLINK/frontend
npm install
```

Para el backend normalmente Maven descarga dependencias automaticamente al ejecutar pruebas.

## 1.4 Variables y archivos sensibles

No necesitas usar `.env` real para:

- `mvn test`
- `mvn test jacoco:report`
- `npm run lint`
- `npm test`
- `npm run test:coverage`
- `npm run build`

Para `Cypress`, la suite actual tampoco depende del backend real ni de credenciales reales, pero si necesita que el frontend este levantado.

## 1.5 Sobre Docker

Las pruebas de integracion backend usan `Testcontainers`.

Es importante distinguir dos cosas:

- que `docker` funcione en tu terminal;
- que `Testcontainers` pueda conectarse al daemon Docker con una API compatible.

Aunque `docker ps` o `docker compose up -d` funcionen, las pruebas de integracion igual pueden quedar omitidas si `Testcontainers` no logra negociar correctamente la version de API con Docker.

Por eso puedes ver algo como:

- `103 tests`
- `30 skipped`

Esto puede pasar en cualquiera de estos casos:

- Docker no esta disponible;
- Docker esta activo, pero `Testcontainers` no puede conectarse al daemon;
- existe una incompatibilidad de API entre el cliente usado por `Testcontainers` y el servidor Docker;
- una variable de entorno como `DOCKER_API_VERSION` esta forzando una version demasiado antigua.

### Ejemplo de error real posible

```text
client version 1.32 is too old. Minimum supported API version is 1.40
```

En ese caso, el problema no es que Docker este apagado, sino que `Testcontainers` esta intentando usar una version de API no compatible.

### Que revisar si pasa eso

En la misma terminal donde ejecutas Maven, revisa:

```bash
echo $DOCKER_API_VERSION
docker version
```

Si `DOCKER_API_VERSION` devuelve un valor antiguo, por ejemplo `1.32`, prueba:

```bash
unset DOCKER_API_VERSION
```

Y luego vuelve a correr:

```bash
cd ~/TUTORLINK/backend
mvn test
```

### Interpretacion correcta del resultado

Si ves pruebas `skipped`, no significa automaticamente que Docker no exista. Puede significar que `Testcontainers` no pudo usarlo correctamente desde el entorno de pruebas Java.

## 2. Orden recomendado de ejecucion

Si quieres validar todo de forma ordenada, usa este flujo:

1. Backend unitarias e integracion preparada
2. Cobertura backend
3. Lint frontend
4. Pruebas frontend con Vitest
5. Cobertura frontend
6. Build frontend
7. Cypress local
8. Sonar local, solo si quieres analisis estatico adicional

## 3. Backend

## 3.1 Ejecutar pruebas backend

Abre una terminal y entra a:

```bash
cd ~/TUTORLINK/backend
```

Ejecuta:

```bash
mvn test
```

Que valida:

- pruebas unitarias backend;
- pruebas de integracion preparadas;
- contexto general del backend.

Resultado esperado actual:

- `BUILD SUCCESS`
- `Tests run: 103`
- `Failures: 0`
- `Errors: 0`
- `Skipped: 30`

## 3.2 Generar cobertura backend con JaCoCo

Desde la misma carpeta:

```bash
cd ~/TUTORLINK/backend
```

Ejecuta:

```bash
mvn test jacoco:report
```

Que genera:

- `backend/target/site/jacoco/index.html`
- `backend/target/site/jacoco/jacoco.xml`

Para abrir el reporte visual en Linux:

```bash
xdg-open ~/TUTORLINK/backend/target/site/jacoco/index.html
```

## 4. Frontend

## 4.1 Ejecutar lint

Abre una terminal y entra a:

```bash
cd ~/TUTORLINK/frontend
```

Ejecuta:

```bash
npm run lint
```

Que valida:

- calidad estatica del frontend;
- problemas de codigo detectados por `ESLint`.

Resultado esperado actual:

- ejecucion exitosa sin errores

## 4.2 Ejecutar pruebas frontend con Vitest

Desde la misma carpeta:

```bash
cd ~/TUTORLINK/frontend
```

Ejecuta:

```bash
npm test
```

Que valida:

- componentes;
- paginas;
- formularios;
- guardas de rutas;
- flujos visuales con mocks.

Resultado esperado actual:

- `9` archivos de prueba
- `29` pruebas
- todo en verde

## 4.3 Generar cobertura frontend

Desde la misma carpeta:

```bash
cd ~/TUTORLINK/frontend
```

Ejecuta:

```bash
npm run test:coverage
```

Que genera:

- `frontend/coverage/index.html`
- `frontend/coverage/lcov.info`

Para abrir el reporte visual:

```bash
xdg-open ~/TUTORLINK/frontend/coverage/index.html
```

## 4.4 Validar build frontend

Desde la misma carpeta:

```bash
cd ~/TUTORLINK/frontend
```

Ejecuta:

```bash
npm run build
```

Que valida:

- que el frontend compile correctamente para release;
- que `Vite` pueda construir los assets finales.

Resultado esperado actual:

- build exitoso

## 5. Cypress E2E local

## 5.1 Que debes hacer antes

Para `Cypress` necesitas levantar el frontend en otra terminal.

No necesitas levantar el backend para la suite actual, porque los flujos principales usan `intercepts` y fixtures.

## 5.2 Terminal 1: levantar frontend

En una primera terminal:

```bash
cd ~/TUTORLINK/frontend
npm run dev
```

Deja esa terminal abierta.

## 5.3 Terminal 2: ejecutar Cypress

En una segunda terminal:

```bash
cd ~/TUTORLINK/frontend
npm run cy:run
```

Si quieres abrir la interfaz grafica:

```bash
cd ~/TUTORLINK/frontend
npm run cy:open
```

## 5.4 Que valida Cypress

La suite actual cubre:

- autenticacion visual;
- OTP mockeado;
- flujo estudiante;
- flujo tutor;
- flujo administrador;
- control de acceso por rol.

## 5.5 Limitacion importante

`Cypress` no esta definido todavia como compuerta estable universal.

Puede depender de:

- la red;
- el runtime local del binario;
- el frontend levantado en `http://localhost:5173`.

Si falla, revisa primero:

- que `npm run dev` siga activo;
- que el puerto `5173` este disponible;
- que Cypress pueda abrir correctamente su runtime local.

## 6. Sonar local

## 6.1 Antes de ejecutar

Necesitas:

- una instancia Sonar disponible, por ejemplo `http://localhost:9000`
- `sonar-scanner` instalado
- token configurado como variable de entorno local

No pongas el token en archivos del repo.

## 6.2 Ejecutar Sonar

Desde la raiz del repo:

```bash
cd ~/TUTORLINK
sonar-scanner
```

## 6.3 Que usa Sonar

La configuracion ya preparada toma como base:

- `backend/target/site/jacoco/jacoco.xml`
- `frontend/coverage/lcov.info`

Por eso antes de correr `Sonar`, conviene ejecutar:

```bash
cd ~/TUTORLINK/backend
mvn test jacoco:report

cd ~/TUTORLINK/frontend
npm run test:coverage
```

## 7. Ejecucion completa recomendada

## 7.1 Validacion tecnica sin Cypress

Si solo quieres validar backend y frontend:

```bash
cd ~/TUTORLINK/backend
mvn test
mvn test jacoco:report

cd ~/TUTORLINK/frontend
npm run lint
npm test
npm run test:coverage
npm run build
```

## 7.2 Validacion completa con Cypress

Terminal 1:

```bash
cd ~/TUTORLINK/frontend
npm run dev
```

Terminal 2:

```bash
cd ~/TUTORLINK/backend
mvn test
mvn test jacoco:report

cd ~/TUTORLINK/frontend
npm run lint
npm test
npm run test:coverage
npm run build
npm run cy:run
```

## 8. Donde ver los reportes

## 8.1 Backend

- cobertura HTML: `~/TUTORLINK/backend/target/site/jacoco/index.html`
- cobertura XML: `~/TUTORLINK/backend/target/site/jacoco/jacoco.xml`

## 8.2 Frontend

- cobertura HTML: `~/TUTORLINK/frontend/coverage/index.html`
- cobertura LCOV: `~/TUTORLINK/frontend/coverage/lcov.info`

## 8.3 Cypress

- screenshots: `~/TUTORLINK/frontend/cypress/screenshots/`
- videos: `~/TUTORLINK/frontend/cypress/videos/`

## 8.4 Sonar

- dashboard web: normalmente `http://localhost:9000`

## 9. Problemas comunes

## 9.1 `mvn test` muestra tests skipped

Si ves pruebas omitidas de integracion, normalmente el origen es `Docker` o `Testcontainers`.

Eso no significa que las unitarias hayan fallado.

Revisa si el log menciona algo como:

- Docker no disponible;
- `Could not find a valid Docker environment`;
- `client version ... is too old`;
- incompatibilidad de API con Docker.

Si aparece una linea parecida a:

```text
client version 1.32 is too old. Minimum supported API version is 1.40
```

entonces el problema es de compatibilidad entre `Testcontainers` y la API Docker usada en esa terminal.

Prueba:

```bash
echo $DOCKER_API_VERSION
unset DOCKER_API_VERSION
cd ~/TUTORLINK/backend
mvn test
```

## 9.2 `npm run cy:run` dice que no encuentra `http://localhost:5173`

Significa que no levantaste el frontend antes.

Solucion:

```bash
cd ~/TUTORLINK/frontend
npm run dev
```

Y luego vuelve a correr Cypress en otra terminal.

## 9.3 Sonar no corre

Revisa:

- que `sonar-scanner` este instalado;
- que `SONAR_TOKEN` este cargado localmente;
- que el servidor Sonar este levantado;
- que ya hayas generado `jacoco.xml` y `lcov.info`.

## 10. Comandos cortos de referencia

## Backend

```bash
cd ~/TUTORLINK/backend
mvn test
mvn test jacoco:report
```

## Frontend

```bash
cd ~/TUTORLINK/frontend
npm run lint
npm test
npm run test:coverage
npm run build
```

## Cypress

```bash
cd ~/TUTORLINK/frontend
npm run dev
```

En otra terminal:

```bash
cd ~/TUTORLINK/frontend
npm run cy:run
```

## Sonar

```bash
cd ~/TUTORLINK
sonar-scanner
```
