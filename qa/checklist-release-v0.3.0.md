# Checklist de Release v0.3.0

## 1. Codigo

- [x] Backend compila y ejecuta pruebas base.
- [x] Frontend compila.
- [x] No se agregaron secretos al repositorio dentro del cierre QA.
- [x] `.env` no forma parte del material versionable de release.
- [x] `.scannerwork` queda fuera de versionado.
- [x] `target/`, `dist/` y `coverage/` quedan fuera de versionado.

## 2. Pruebas backend

- [x] Pruebas unitarias pasan dentro de `mvn test`.
- [x] Suites de integracion existen y estan integradas al proyecto.
- [ ] Pruebas de integracion pasan completamente en este entorno.
  Observacion: se omiten por falta de Docker valido para `Testcontainers`.
- [x] `JaCoCo` genera reporte.

## 3. Pruebas frontend

- [x] `npm run lint` pasa.
- [x] `npm test` pasa.
- [x] `npm run build` pasa.
- [x] `npm run test:coverage` genera reporte.

## 4. Cypress

- [x] `Cypress` esta configurado.
- [x] Existen specs y fixtures documentadas.
- [x] Evidencias y modo de ejecucion local estan documentados.
- [ ] `Cypress` es compuerta estable de CI.
  Observacion: queda pendiente; su ejecucion sigue siendo local/manual y dependiente del entorno.
- [ ] Ejecucion local completamente repetible en todos los entornos.
  Observacion: condicionada al frontend levantado y al runtime local del binario.

## 5. Seguridad

- [x] Rutas protegidas documentadas y validadas por pruebas.
- [x] Roles de estudiante, tutor y administrador tienen cobertura visible.
- [x] No hay credenciales reales dentro de la configuracion versionada de QA.
- [x] `OTP` y `reCAPTCHA` se trataron de forma segura para testing, sin desactivar seguridad productiva por defecto.

## 6. CI/CD

- [x] El workflow `quality-ci.yml` existe.
- [x] La compuerta backend esta activa con `mvn test jacoco:report`.
- [x] La compuerta frontend esta activa con `lint`, `test`, `test:coverage` y `build`.
- [x] La cobertura queda integrada a CI para backend y frontend.
- [x] `Sonar` queda preparado localmente.
- [ ] `Sonar` corre como analisis obligatorio en CI.
  Observacion: no se activa sin secretos ni configuracion externa estable.

## 7. Documentacion

- [x] El plan de pruebas fue actualizado.
- [x] El informe final QA fue creado.
- [x] La matriz de trazabilidad fue creada.
- [x] El control de cambios QA fue creado.
- [x] Las evidencias y sus instrucciones quedaron documentadas.
- [x] Las limitaciones del release quedaron registradas.

## 8. Aprobacion

- [ ] QA
- [ ] Backend
- [ ] Frontend
- [ ] Coordinacion tecnica

## Decision recomendada

Estado propuesto para `v0.3.0`: **Aceptada con observaciones**.
