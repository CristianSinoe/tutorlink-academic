# Acta de inicio de semana – TutorLink

## 1. Datos generales

- Proyecto: TutorLink
- Semana correspondiente: Semana 05
- Fecha de reunión: 2026-04-20
- Modalidad: Reunión técnica
- Responsable de la reunión: Cristian Sinoe Hernández Ruiz
- Participantes:
  - Cristian Sinoe Hernández Ruiz
  - Benjamin Emmanuel Coello Trujillo
  - Yatana Roa

## 2. Objetivo de la reunión

Preparar el inicio de desarrollo backend y las decisiones de seguridad, persistencia y datos.

## 3. Avances revisados

- Planeación del stack Spring Boot, JWT, OTP, PostgreSQL y Flyway.
- Revisión de entidades de usuarios, estudiantes, tutores y preguntas.
- Delimitación de roles y flujos de acceso.
- Evidencia reconstruida por estado técnico actual y documentación arquitectónica.

## 4. Acuerdos del equipo

- Se acuerda priorizar seguridad y control por roles desde la base.
- Se acuerda versionar el esquema por migraciones.
- Se acuerda mantener separación por capas: controladores, servicios, repositorios y DTOs.

## 5. Cambios aprobados durante la semana

- CC-015 – Ajuste de seguridad y autenticación – Aprobado – Cristian Sinoe Hernández Ruiz
- CC-021 – Inclusión de historial y versionado de respuestas – Aprobado – Cristian Sinoe Hernández Ruiz

## 6. Responsables y compromisos

| Actividad | Responsable | Fecha compromiso | Estado |
| --- | --- | --- | --- |
| Iniciar base de seguridad backend | Cristian Sinoe Hernández Ruiz | 2026-04-24 | Completado por reconstrucción |
| Preparar lineamientos de interacción frontend | Benjamin Emmanuel Coello Trujillo | 2026-04-24 | En seguimiento |
| Validar flujos funcionales esperados por rol | Yatana Roa | 2026-04-24 | En seguimiento |

## 7. Riesgos o incidencias identificadas

- Dependencia de correo SMTP para OTP.
- Riesgo de inconsistencias si el modelo de datos cambia tarde.
- Riesgo de incremento de complejidad por seguridad reforzada.

## 8. Cierre del acta

Los integrantes del equipo manifiestan estar de acuerdo con los puntos tratados, los cambios registrados y los compromisos asignados para la semana correspondiente.

## 9. Validación del equipo

- Cristian Sinoe Hernández Ruiz – De acuerdo
- Benjamin Emmanuel Coello Trujillo – De acuerdo
- Yatana Roa – De acuerdo
