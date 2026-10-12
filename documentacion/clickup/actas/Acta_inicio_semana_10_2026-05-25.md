# Acta de inicio de semana – TutorLink

## 1. Datos generales

- Proyecto: TutorLink
- Semana correspondiente: Semana 10
- Periodo de trabajo: 2026-05-25 al 2026-05-29
- Fecha de reunión: 2026-05-25
- Modalidad: Reunión de cierre QA, SonarQube e integración final
- Responsable de la reunión: Cristian Sinoe Hernández Ruiz
- Participantes:
  - Cristian Sinoe Hernández Ruiz
  - Benjamin Emmanuel Coello Trujillo
  - Yatana Roa

## 2. Objetivo de la reunión

Organizar el cierre técnico y académico de TutorLink, priorizando la estabilización de workflows, la corrección de hallazgos SonarQube, la consolidación de evidencias QA y la integración controlada hacia las ramas `develop`, `release` y `main`.

## 3. Avances revisados

- Cierre de fases QA orientadas a pruebas backend, pruebas frontend, cobertura, Cypress local, JaCoCo, Vitest coverage y preparación de SonarQube.
- Corrección de fallos en GitHub Actions relacionados con backend, frontend, configuración de reCAPTCHA en pruebas y estabilización de aserciones.
- Corrección de issues SonarQube en backend y frontend, incluyendo mantenibilidad, accesibilidad y contraste visual.
- Validación de compuertas técnicas:
  - Backend: `mvn test jacoco:report`.
  - Frontend: `npm run lint`, `npm test -- --run`, `npm run test:coverage -- --run` y `npm run build`.
- Integración controlada del flujo de ramas:
  - `yatana -> develop`.
  - `develop -> release`.
  - `release -> main`.
- Elaboración de documentación de cierre QA y del informe final del proyecto.

## 4. Acuerdos del equipo

- Se acuerda no integrar cambios hacia ramas principales sin validaciones backend y frontend exitosas.
- Se acuerda mantener `main` como rama estable final para la entrega académica.
- Se acuerda conservar el stash de cambios locales no relacionados hasta decidir su destino.
- Se acuerda no crear tag de versión hasta confirmar formalmente el cierre.
- Se acuerda registrar como pendientes posteriores la mejora de cobertura, revisión de warnings de build y continuidad de SonarQube en futuros releases.
- Se acuerda documentar el cierre con evidencia clara para revisión académica y técnica.

## 5. Cambios aprobados durante la semana

- Cierre QA v0.3.0 – Aprobado – Cristian / Yatana
- Integración de correcciones QA y Sonar en `develop` – Aprobado – Cristian Sinoe Hernández Ruiz
- Preparación de release desde `develop` hacia `release` – Aprobado – Cristian Sinoe Hernández Ruiz
- Integración final de `release` hacia `main` – Aprobado – Cristian Sinoe Hernández Ruiz
- Corrección de issues SonarQube backend – Aprobado – Cristian Sinoe Hernández Ruiz
- Corrección de issues SonarQube frontend – Aprobado – Benjamin Emmanuel Coello Trujillo
- Generación del informe de cierre del proyecto TutorLink – Aprobado – Cristian / Yatana

## 6. Responsables y compromisos

| Actividad | Responsable | Fecha compromiso | Estado |
| --- | --- | --- | --- |
| Validar backend con pruebas y JaCoCo | Cristian Sinoe Hernández Ruiz | 2026-05-29 | Completado |
| Validar frontend con lint, pruebas, coverage y build | Benjamin Emmanuel Coello Trujillo | 2026-05-29 | Completado |
| Confirmar evidencias QA y criterios de aceptación | Yatana Roa | 2026-05-29 | Completado |
| Integrar `yatana` hacia `develop` | Cristian Sinoe Hernández Ruiz | 2026-05-29 | Completado |
| Integrar `develop` hacia `release` | Cristian Sinoe Hernández Ruiz | 2026-05-29 | Completado |
| Integrar `release` hacia `main` | Cristian Sinoe Hernández Ruiz | 2026-05-29 | Completado |
| Revisar creación de tag `v0.3.0` | Equipo TutorLink | Posterior al cierre formal | Pendiente |

## 7. Riesgos o incidencias identificadas

- Riesgo de mezclar cambios funcionales locales con commits de QA o cierre.
- Riesgo de subir artefactos generados como `coverage`, `.scannerwork`, logs o archivos temporales.
- Riesgo de fallos de workflow por diferencias entre entorno local y GitHub Actions.
- Riesgo de que Cypress no sea una compuerta estable en CI.
- Riesgo de baja cobertura inicial en frontend y backend.
- Riesgo de warnings no bloqueantes en build frontend por tamaño de bundle.
- Riesgo de dependencias externas de red al hacer pull, push o descargar imágenes Docker.

## 8. Acciones de mitigación

- Uso de stash temporal para proteger cambios locales ajenos.
- Uso de staging selectivo y rechazo explícito de `git add .`.
- Ejecución de compuertas backend y frontend antes de cada integración.
- Documentación de limitaciones y pendientes posteriores a `v0.3.0`.
- No creación de tag hasta obtener confirmación formal del equipo.
- Registro de evidencia en documentación QA, informe final y control de cierre.

## 9. Cierre del acta

Los integrantes del equipo manifiestan estar de acuerdo con los puntos tratados, los cambios registrados y los compromisos asignados para la semana correspondiente. La semana se orienta al cierre técnico de TutorLink, dejando evidencia de calidad, trazabilidad de ramas y documentación formal para revisión académica.

## 10. Validación del equipo

- Cristian Sinoe Hernández Ruiz – De acuerdo
- Benjamin Emmanuel Coello Trujillo – De acuerdo
- Yatana Roa – De acuerdo
