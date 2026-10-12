# Plantilla de Solicitud de Cambio – TutorLink

## Propósito

Esta plantilla se utiliza para registrar de manera formal una solicitud o requerimiento de cambio del proyecto TutorLink, de forma que pueda analizarse, compararse con la matriz de control de cambios del proyecto y resolverse con trazabilidad.

## Instrucciones de uso

- Completar todos los campos obligatorios.
- Mantener el identificador del cambio con formato `CC-XXX`.
- Redactar la información con enfoque verificable y concreto.
- Si un campo todavía no cuenta con datos definitivos, marcarlo como `Pendiente de evaluación`.
- La resolución final debe reflejarse también en la matriz principal del documento `Control de Cambios – Proyecto TutorLink`.

## Correspondencia con la matriz de cambios

| Campo de la plantilla | Campo relacionado en la matriz |
| --- | --- |
| Proyecto | Referencia general del proyecto |
| Fecha | Fecha |
| Solicitante del cambio | Solicitante |
| Cambio No. | ID |
| Categoría del cambio | Categoría |
| Implicación del cambio | Tipo de implicación |
| Área afectada | Área afectada |
| Descripción del cambio que solicita | Descripción del cambio |
| Motivo del cambio que solicita | Justificación |
| Alternativas consideradas | Alternativas consideradas |
| Cambios técnicos requeridos | Cambios técnicos requeridos |
| Riesgos considerados | Riesgos por implementar / Riesgos de no aprobar |
| Recursos y costos necesarios | Recursos/costos estimados |
| Implicancias en calidad | Implicancias en calidad |
| Impacto en cronograma, costo y/o alcance | Impacto en cronograma/costo/alcance |
| Fecha estimada de implementación | Fecha estimada de implementación |
| Resolución | Decisión |
| Justificación de la decisión | Justificación de la decisión |
| Consentimiento del Project Manager | Responsable |

---

## Formulario de Solicitud de Cambio

### 1. Identificación del Cambio

- **Proyecto:** TutorLink
- **Fecha:** [AAAA-MM-DD]
- **Solicitante del cambio:** [Nombre, rol o entidad]
- **Cambio No.:** [CC-XXX]

### 2. Clasificación del Cambio

- **Categoría del Cambio:** [Cronograma / Costo / Alcance / Requerimientos-Entregables / Testing-Calidad / Recursos / Documentación / Arquitectura / Base de datos / Seguridad / DevOps-Entorno / Gestión del proyecto / Otro]
- **Implicación del cambio:** [Acción Correctiva / Acción Preventiva / Defecto de Reparación / Actualización / Otro]
- **Área afectada:** [Módulo, proceso, entregable, equipo o componente impactado]

### 3. Detalle de la Solicitud

- **Descripción del cambio que solicita:**
  [Explicación detallada de la modificación requerida, incluyendo qué se quiere cambiar y sobre qué elemento del proyecto aplica.]

- **Motivo del cambio que solicita:**
  [Justificación del cambio, necesidad de negocio, hallazgo técnico, observación académica, incidencia operativa o causa que origina la solicitud.]

- **Alternativas consideradas:**
  [Opciones evaluadas antes de proponer este cambio. Si no existen alternativas viables, indicar expresamente "No se identifican alternativas viables".]

- **Alternativa de operación si el cambio no se implementa:**
  [Describir cómo se continuaría operando o gestionando el proyecto si la solicitud no es aprobada.]

### 4. Evaluación de Impactos (Análisis)

- **Cambios técnicos requeridos:**
  [Describir ajustes funcionales, técnicos, documentales, operativos, de pruebas, infraestructura, seguridad o base de datos necesarios para implementar el cambio.]

- **Riesgos considerados:**
  [Registrar amenazas, restricciones, dependencias o efectos secundarios. Incluir, de ser posible, tanto riesgos de implementar como riesgos de no implementar el cambio.]

- **Recursos y costos necesarios:**
  [Indicar horas estimadas, perfiles requeridos, herramientas, licencias, infraestructura, presupuesto, esfuerzo documental o cualquier otro recurso asociado.]

- **Implicancias en calidad:**
  [Explicar cómo afecta criterios de calidad, pruebas, validación, cobertura, mantenibilidad, usabilidad, seguridad o conformidad del entregable.]

- **Impacto en el cronograma, costo y/o alcance:**
  [Precisar si el cambio modifica fechas, esfuerzo total, presupuesto, funcionalidades comprometidas, entregables o línea base del proyecto.]

- **Fecha estimada de implementación:** [AAAA-MM-DD o Pendiente de evaluación]

- **Impacto general del cambio:**
  [Bajo / Medio / Alto, acompañado de una breve explicación.]

### 5. Resolución y Aprobación

- **Resolución:** [Aprobar / Rechazar / Posponer]
- **Justificación de la decisión:**
  [Argumentos que sustentan la decisión tomada.]

### 6. Consentimiento del Project Manager

- **Nombre:** [Nombre del Project Manager o responsable autorizante]
- **Firma:** [Espacio para firma o validación]
- **Fecha:** [AAAA-MM-DD]

---

## Recomendación de registro posterior

Una vez resuelta esta solicitud:

1. Registrar o actualizar la fila correspondiente en la matriz del documento `Control de Cambios – Proyecto TutorLink`.
2. Mantener el mismo `Cambio No.` para conservar trazabilidad entre solicitud, análisis, decisión y evidencia.
3. Vincular evidencia técnica o documental cuando exista: commits, PRs, actas, pruebas, incidencias o documentos de soporte.
