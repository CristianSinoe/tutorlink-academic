# Acta de inicio de semana – TutorLink

## 1. Datos generales

- Proyecto: TutorLink
- Semana correspondiente: Semana 09
- Fecha de reunión: 2026-05-18
- Modalidad: Reunión de calidad, mejoras y cierre documental
- Responsable de la reunión: Cristian Sinoe Hernández Ruiz
- Participantes:
  - Cristian Sinoe Hernández Ruiz
  - Benjamin Emmanuel Coello Trujillo
  - Yatana Roa

## 2. Objetivo de la reunión

Revisar mejoras en curso, análisis de calidad, documentación final y preparación de control de cambios.

## 3. Avances revisados

- Ejecuciones SonarQube y revisión de deuda técnica backend.
- Trabajo en curso sobre hilo conversacional, revisiones de mensajes y reenvío de OTP.
- Verificación del estado actual: backend con pruebas exitosas, frontend con build exitoso y deuda de lint pendiente.
- Generación de documentación formal para ClickUp.

## 4. Acuerdos del equipo

- Se acuerda no registrar como cerrado un cambio sin evidencia técnica o documental suficiente.
- Se acuerda diferenciar cambios implementados, en evaluación y pospuestos.
- Se acuerda mantener control de calidad sobre backend y frontend antes de un siguiente release.
- Se acuerda consolidar actas y control de cambios en ClickUp.

## 5. Cambios aprobados durante la semana

- CC-010 – Incorporación de análisis estático con SonarQube – Aprobado – Cristian Sinoe Hernández Ruiz
- CC-011 – Corrección de issues detectados por SonarQube – Aprobado – Cristian Sinoe Hernández Ruiz
- CC-012 – Evaluación de frontend con herramientas de calidad – Aprobado – Benjamin Emmanuel Coello Trujillo
- CC-030 – Reenvío de OTP y endurecimiento del flujo de acceso – Aprobado – Cristian / Benjamin
- CC-031 – Implementación en curso de hilo conversacional y revisiones de mensajes – Aprobado – Cristian / Benjamin
- CC-032 – Corrección pendiente de hallazgos ESLint en frontend – Aprobado – Benjamin Emmanuel Coello Trujillo
- CC-033 – Validación ejecutable del estado actual – Aprobado – Cristian / Yatana

## 6. Responsables y compromisos

| Actividad | Responsable | Fecha compromiso | Estado |
| --- | --- | --- | --- |
| Consolidar control de cambios | Cristian Sinoe Hernández Ruiz | 2026-05-23 | Completado |
| Corregir hallazgos de lint frontend | Benjamin Emmanuel Coello Trujillo | 2026-05-26 | Pendiente |
| Revisar validación funcional de mejoras en curso | Yatana Roa | 2026-05-26 | Pendiente |

## 7. Riesgos o incidencias identificadas

- Issues detectados por SonarQube aún no totalmente cerrados.
- `npm run lint` falla con 8 hallazgos en frontend.
- El hilo conversacional amplía el alcance y requiere decisión formal de cierre.
- No existe cronograma versionado independiente en el repositorio.

## 8. Cierre del acta

Los integrantes del equipo manifiestan estar de acuerdo con los puntos tratados, los cambios registrados y los compromisos asignados para la semana correspondiente.

## 9. Validación del equipo

- Cristian Sinoe Hernández Ruiz – De acuerdo
- Benjamin Emmanuel Coello Trujillo – De acuerdo
- Yatana Roa – De acuerdo
