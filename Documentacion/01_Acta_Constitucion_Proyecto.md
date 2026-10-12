# Acta de Constitución del Proyecto (Project Charter)

## 1. Información general del proyecto

- **Nombre del proyecto:** TutorLink - Plataforma digital para gestión de tutorías académicas universitarias
- **Fecha de elaboración:** 2026-03-25
- **Tipo de proyecto:** Proyecto de software institucional
- **Cliente / Patrocinador institucional:** Universidad Veracruzana (UV)
- **Fase:** Inicio

## 2. Propósito del proyecto

Desarrollar e implantar una plataforma web que permita gestionar de forma segura, estructurada y trazable la relación entre estudiantes, tutores y administradores académicos, facilitando la atención de dudas, la asignación de tutorías y el seguimiento de interacciones académicas.

## 3. Antecedentes y contexto

En entornos universitarios, la gestión de tutorías y acompañamiento académico suele operar con procesos fragmentados, poco trazables y altamente dependientes de correo informal, mensajería o gestión manual. Esto genera tiempos de respuesta variables, poca visibilidad institucional y dificultades para dar seguimiento a estudiantes y tutores.

TutorLink surge como una respuesta a esa necesidad, proponiendo una solución centralizada con control por roles, autenticación reforzada, trazabilidad operativa y un flujo estructurado para registro, asignación, atención y seguimiento de preguntas académicas.

## 4. Justificación del proyecto

El proyecto se justifica por la necesidad de:

- digitalizar el proceso de tutorías académicas;
- reducir la dependencia de mecanismos manuales o no estandarizados;
- mejorar la trazabilidad de las interacciones entre estudiantes y tutores;
- fortalecer la seguridad de acceso a información académica;
- facilitar la administración institucional de usuarios, estados y asignaciones;
- contar con evidencia operativa y auditoría para fines de control y mejora continua.

Desde una perspectiva de dirección de proyectos, el proyecto se inicia porque existe una necesidad de negocio claramente identificada, una oportunidad de mejora institucional y una solución tecnológica viable para abordar el problema operativo actual.

## 5. Objetivo general

Implementar una plataforma de tutorías académicas que permita administrar usuarios institucionales, asignar estudiantes a tutores, canalizar preguntas académicas y asegurar el seguimiento del proceso mediante un sistema web con autenticación segura y arquitectura escalable.

## 6. Objetivos específicos del negocio

- Centralizar en una sola plataforma el proceso de interacción académica entre estudiante y tutor.
- Reducir tiempos de atención y respuesta a preguntas académicas.
- Garantizar que cada estudiante pueda identificar y consultar a su tutor asignado.
- Brindar a la administración académica control sobre altas, estados, perfiles y asignaciones.
- Elevar la seguridad del acceso mediante autenticación con OTP y control por roles.
- Asegurar trazabilidad institucional sobre accesos, operaciones y eventos críticos.

## 7. Alcance de alto nivel del proyecto

El alcance funcional identificado en la solución actual incluye:

- autenticación con credenciales, reCAPTCHA y OTP;
- primer acceso mediante enlace de activación;
- administración de usuarios `ADMIN`, `TUTOR` y `ESTUDIANTE`;
- creación y edición de perfiles académicos;
- importación masiva por CSV;
- asignación de estudiantes a tutores;
- consulta del tutor asignado por parte del estudiante;
- creación de preguntas académicas;
- atención de preguntas por parte del tutor;
- corrección, rechazo o reclasificación de preguntas;
- consulta de historial y dashboard por rol;
- auditoría de acciones y eventos de seguridad;
- cambio de contraseña con OTP.

## 8. Exclusiones de alcance de alto nivel

Con base en lo observado en el código, quedan fuera del alcance actual:

- videollamadas o tutorías síncronas en tiempo real;
- notificaciones push o mensajería instantánea;
- analítica avanzada institucional;
- integración formal con sistemas escolares externos;
- app móvil nativa;
- flujos multisedes o multiinstitución.

## 9. Entregables principales

- frontend web para estudiantes, tutores y administradores;
- backend REST con control de acceso por roles;
- base de datos relacional con modelo de usuarios, tutorías y preguntas;
- mecanismos de autenticación, OTP y primer login;
- módulo administrativo de altas, edición e importación;
- módulo de preguntas y respuestas;
- registro de auditoría;
- documentación técnica y funcional del sistema.

## 10. Stakeholders clave

- Universidad Veracruzana (UV) - Cliente / Patrocinador institucional
- Dirección o coordinación académica de la UV
- Administradores del sistema
- Tutores académicos
- Estudiantes
- Equipo de desarrollo
- Equipo de operación o soporte técnico

## 11. Roles de negocio identificados

### `ADMIN`

Responsable de:

- crear usuarios;
- importar usuarios;
- administrar estados;
- asignar tutor-estudiante;
- consultar listados y relaciones académicas.

### `ESTUDIANTE`

Responsable de:

- autenticarse en la plataforma;
- consultar su tutor asignado;
- crear preguntas académicas;
- revisar detalle de sus preguntas;
- consultar respuestas e historial.

### `TUTOR`

Responsable de:

- atender preguntas asignadas;
- responder, corregir, rechazar o reclasificar consultas;
- consultar dashboard y pendientes;
- mantener su perfil profesional/académico.

## 12. Supuestos del proyecto

- La institución dispone de correos institucionales válidos para sus usuarios.
- Existe una operación académica que asigna formalmente estudiantes a tutores.
- Los administradores cuentan con insumos correctos para altas e importaciones por CSV.
- El sistema será usado inicialmente en un entorno universitario controlado.
- La disponibilidad de correo SMTP es suficiente para OTP y flujos de onboarding.

## 13. Restricciones del proyecto

- Dependencia de configuración de correo para los flujos críticos.
- Dependencia de PostgreSQL como motor de persistencia.
- Dependencia de reCAPTCHA para validación antiabuso.
- Operación obligatoria bajo arquitectura Cloud gestionada (`Render`, `Aiven`, `Resend`) ajena a servidores físicos de la UV.
- Arquitectura monolítica, adecuada para la etapa actual pero con límites de escalamiento horizontal funcional.

## 14. Riesgos iniciales de alto nivel

- Falla de entrega de correos OTP o primer acceso.
- Configuración inconsistente entre ambientes.
- Dependencia de procesos administrativos para mantener asignaciones correctas.
- Posible degradación de rendimiento si el volumen de consultas crece y ciertos filtros siguen ejecutándose en memoria.
- Riesgos de endurecimiento de seguridad si el frontend mantiene token en `localStorage` sin controles complementarios.
- Dependencia de la disponibilidad (SLA) de proveedores Cloud externos para la operación continua de la plataforma.

## 15. Presupuesto y Tiempos Preliminares

- **Tiempo estimado de ejecución:** 6 semanas para implementación, integración, pruebas y salida productiva inicial.
- **Presupuesto preliminar total estimado:** ~`928,000 MXN`.
- **Estructura de costo preliminar:** costo de construcción (pago único) para desarrollo, QA, DevOps, dirección y documentación; y costo operativo Cloud (OPEX) recurrente en `Render` (Frontend/Backend), `Aiven PostgreSQL`, `Resend` y dominio institucional.

## 16. Criterios de aprobación del proyecto

El proyecto se considerará formalmente constituido y orientado al cumplimiento de negocio cuando:

- cubra los flujos de alta, autenticación, asignación y atención de preguntas;
- exista separación funcional por roles;
- la seguridad básica del acceso esté operativa;
- la trazabilidad de acciones críticas esté disponible;
- el sistema sea apto para ser utilizado por una operación académica real.

## 17. Criterios preliminares de éxito

Durante la fase de inicio, el proyecto será considerado correctamente autorizado si:

- existe alineación entre necesidad de negocio, objetivos y alcance inicial;
- los principales interesados están identificados;
- los riesgos, restricciones y supuestos iniciales han sido documentados;
- el producto esperado tiene una definición preliminar suficiente para pasar a planificación.

## 18. Autorización para avanzar a planificación

La presente acta autoriza formalmente el inicio del proyecto TutorLink y habilita la transición a la fase de planificación, con base en la necesidad institucional identificada, la viabilidad preliminar de la solución y la definición inicial de objetivos, alcance y criterios de aceptación.
