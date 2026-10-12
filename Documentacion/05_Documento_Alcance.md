# Documento de Alcance del Proyecto

## 1. Descripcion del alcance del proyecto y del producto

El proyecto `TutorLink` comprende el desarrollo, integracion, pruebas, despliegue y transferencia operativa de una plataforma web institucional para la gestion de tutorias academicas en la Universidad Veracruzana (UV). El producto se implementa sobre una arquitectura cloud realista con frontend SPA en `React + Vite`, backend API REST en `Spring Boot`, persistencia en `PostgreSQL` gestionado y servicios externos para correo transaccional y seguridad.

El alcance contempla la puesta en operacion en nube con servicios administrados: frontend en `Render`, backend en `Render`, base de datos en `Aiven PostgreSQL` y servicio de correos mediante `Resend` con dominio personalizado institucional. La solucion incluye control de acceso por roles (`ADMIN`, `TUTOR`, `ESTUDIANTE`), autenticacion con `JWT` y `OTP`, asignaciones tutor-estudiante, preguntas/respuestas academicas y trazabilidad auditable.

Caracteristicas clave redactadas bajo criterio SMART:

- Implementar una plataforma web operativa antes del cierre del proyecto que permita autenticacion segura con credenciales + `OTP` para los tres roles del sistema.
- Habilitar en el periodo del proyecto la gestion administrativa de usuarios, asignaciones y carga masiva por `CSV` con trazabilidad funcional.
- Permitir que estudiantes registren y consulten preguntas academicas, y que tutores atiendan dichas preguntas con historial verificable.
- Desplegar el sistema en ambiente cloud productivo para UV con configuracion documentada de frontend, backend, base de datos y correo.
- Entregar evidencia de pruebas funcionales criticas y documentacion minima de operacion para soporte institucional.

## 2. Entregables del proyecto (Lo que SI incluye)

Los entregables incluidos en el alcance son:

- Frontend institucional `React + Vite` para administradores, tutores y estudiantes.
- API REST en `Spring Boot` con modulos de autenticacion, administracion, estudiante y tutor.
- Modelo relacional en `PostgreSQL` con migraciones controladas por `Flyway`.
- Seguridad de aplicacion con `Spring Security`, `JWT`, `OTP` y validacion `reCAPTCHA`.
- Modulo de gestion de usuarios (alta, edicion, activacion, bloqueo y consulta).
- Modulo de asignacion tutor-estudiante con reglas de consistencia.
- Modulo de preguntas y respuestas academicas con historial por rol.
- Modulo de perfil del tutor con actualizacion de datos academicos/profesionales.
- Carga masiva de usuarios/asignaciones por archivo `CSV` con procesamiento temporal en memoria.
- Registro de auditoria para eventos de autenticacion y operaciones criticas.
- Configuracion de despliegue continuo (`CI/CD`) en `Render` para frontend y backend.
- Configuracion productiva de base de datos gestionada en `Aiven PostgreSQL`.
- Configuracion de servicio de correo transaccional en `Resend` para OTP y notificaciones.
- Compra y vinculacion de dominio web institucional (ejemplo: `tutorlink-uv.mx`) para frontend y correo.
- Configuracion de variables de entorno, secretos y parametros por ambiente (dev, staging, prod).
- Documentacion tecnica y funcional minima para operacion, soporte y transferencia.

## 3. Exclusiones del proyecto (Lo que NO incluye)

Quedan fuera del alcance:

- Desarrollo de aplicaciones moviles nativas (`iOS`/`Android`).
- Despliegue en servidores fisicos on-premise de la institucion.
- Rediseno a arquitectura de microservicios o plataforma multitenant.
- Integraciones avanzadas con ERP/LMS institucionales no definidas en requisitos base.
- Pasarelas de pago, facturacion o monetizacion de tutorias.
- Chat en tiempo real, videollamadas o mensajeria instantanea integrada.
- Implementacion de almacenamiento persistente de archivos en nube (`S3`, `Cloudinary` u homologos).
- Construccion de un gestor documental de archivos adjuntos de largo plazo.
- Desarrollo de un motor de analitica avanzada o BI corporativo.
- Migraciones masivas historicas no estructuradas fuera de los CSV definidos.
- Migracion del frontend a `Angular` (la base del producto es `React`).

Nota de alcance: los archivos `CSV` se procesan temporalmente en memoria del backend y no se almacenan de forma persistente.

## 4. Criterios de aceptacion

Los entregables se consideran aceptados cuando se cumpla, como minimo:

- Frontend en produccion accesible por dominio oficial y navegacion por rol funcional.
- API en produccion en `Render` respondiendo correctamente endpoints criticos de negocio.
- Conexion estable backend-`Aiven PostgreSQL` con integridad relacional verificada.
- Flujo de autenticacion completo (login + `OTP`) funcional en ambiente productivo.
- Flujo de primer acceso y recuperacion de acceso funcional para usuarios administrativos.
- Gestion de usuarios y asignaciones operativa sin defectos criticos abiertos.
- Flujo de preguntas/respuestas operativo para estudiantes y tutores.
- Envio de correos de autenticacion via `Resend` con dominio personalizado validado.
- Pipelines de despliegue continuo ejecutables para frontend y backend en `Render`.
- Ejecucion de pruebas funcionales e integracion con resultado aprobado por QA.
- Documentacion de despliegue, operacion y contingencia entregada al responsable institucional.

## 5. Restricciones

Restricciones del proyecto y de la arquitectura seleccionada:

- Stack tecnico obligatorio: `React + Vite`, `Spring Boot` (Java 17) y `PostgreSQL`.
- Despliegue obligatorio en cloud administrado (`Render` + `Aiven` + `Resend`) para la fase inicial UV.
- El sistema debe operar bajo los limites de los tiers contratados en nube.
- En `Render`, la capacidad de CPU/RAM y concurrencia depende del plan seleccionado, por lo que picos de carga pueden requerir escalamiento de plan.
- En `Render`, los tiempos de build/deploy y cuotas de ejecucion estan sujetos a politica del plan vigente.
- En `Aiven PostgreSQL`, almacenamiento, conexiones concurrentes y rendimiento IOPS quedan limitados por el tier contratado.
- En `Resend`, el volumen diario/mensual de envios y reputacion de dominio depende del plan y warming del dominio.
- Dominio y DNS institucionales deben estar disponibles para configuracion SSL, SPF, DKIM y DMARC.
- La importacion por `CSV` se realiza en memoria, por lo que el tamano maximo por lote queda restringido por memoria disponible del backend.
- Presupuesto y cronograma aprobados limitan cambios de alcance no justificados mediante control integrado de cambios.

## 6. Supuestos (Premisas)

Para planificar y ejecutar se asume:

- UV autorizara el uso de servicios cloud externos para la operacion inicial del sistema.
- El equipo contara con accesos administrativos a `Render`, `Aiven`, `Resend` y proveedor de dominio.
- Existira disponibilidad de datos maestros validos para carga inicial por `CSV`.
- Las politicas institucionales de seguridad y privacidad permitiran uso de correo transaccional con dominio dedicado.
- Los usuarios clave (academicos y administrativos) participaran en validaciones funcionales dentro del calendario acordado.
- Se dispondra de ambientes separados (desarrollo, pruebas y produccion) con configuracion controlada por variables de entorno.
- El volumen inicial de usuarios y transacciones sera consistente con la capacidad del tier cloud presupuestado.
- La institucion asignara responsables de operacion y soporte para la etapa posterior a la transferencia.
