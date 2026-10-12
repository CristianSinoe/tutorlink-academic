# Acta de inicio de semana – TutorLink

## 1. Datos generales

- Proyecto: TutorLink
- Semana correspondiente: Semana 03
- Fecha de reunión: 2026-04-06
- Modalidad: Reunión de diseño
- Responsable de la reunión: Cristian Sinoe Hernández Ruiz
- Participantes:
  - Cristian Sinoe Hernández Ruiz
  - Benjamin Emmanuel Coello Trujillo
  - Yatana Roa

## 2. Objetivo de la reunión

Definir diseño de arquitectura, modelo de base de datos y patrones técnicos que soportarán la solución.

## 3. Avances revisados

- Definición de separación frontend, backend y base de datos.
- Preparación de arquitectura general, relaciones de persistencia y patrones de diseño.
- Aterrizaje de criterios de seguridad, mantenibilidad y escalabilidad.
- Evidencia base: `docs/arquitectura-tutorlink.puml`, `docs/base-datos-tutorlink.puml`, `docs/patrones-diseno-tutorlink.md`.

## 4. Acuerdos del equipo

- Se acuerda mantener arquitectura desacoplada cliente-servidor.
- Se acuerda usar PostgreSQL con control de migraciones.
- Se acuerda documentar explícitamente patrones de diseño aplicados.

## 5. Cambios aprobados durante la semana

- CC-007 – Documentación de arquitectura del sistema – Aprobado – Cristian Sinoe Hernández Ruiz
- CC-008 – Creación o actualización del diagrama de base de datos – Aprobado – Cristian Sinoe Hernández Ruiz

## 6. Responsables y compromisos

| Actividad | Responsable | Fecha compromiso | Estado |
| --- | --- | --- | --- |
| Documentar arquitectura técnica | Cristian Sinoe Hernández Ruiz | 2026-04-10 | Completado |
| Alinear necesidades de interfaz con arquitectura | Benjamin Emmanuel Coello Trujillo | 2026-04-10 | En seguimiento |
| Revisar consistencia funcional del modelo propuesto | Yatana Roa | 2026-04-10 | En seguimiento |

## 7. Riesgos o incidencias identificadas

- Riesgo de divergencia entre modelo lógico y cambios futuros del código.
- Riesgo de no separar a tiempo patrones de arquitectura y patrones de diseño.
- Necesidad de mantener actualizados diagramas y documentos.

## 8. Cierre del acta

Los integrantes del equipo manifiestan estar de acuerdo con los puntos tratados, los cambios registrados y los compromisos asignados para la semana correspondiente.

## 9. Validación del equipo

- Cristian Sinoe Hernández Ruiz – De acuerdo
- Benjamin Emmanuel Coello Trujillo – De acuerdo
- Yatana Roa – De acuerdo
