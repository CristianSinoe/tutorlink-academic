# Patrones de diseño utilizados en TutorLink

Este documento describe patrones de diseño y patrones de organización de código identificables en el backend actual de TutorLink. Se documentan únicamente los que pueden justificarse con clases y paquetes reales del proyecto.

## Repository Pattern

### Tipo
Patrón de organización de código orientado a persistencia.

### Dónde aparece en el proyecto
- `backend/src/main/java/com/sinoe/authmfa/domain/user/UserRepository.java`
- `backend/src/main/java/com/sinoe/authmfa/domain/user/StudentRepository.java`
- `backend/src/main/java/com/sinoe/authmfa/domain/user/TutorRepository.java`
- `backend/src/main/java/com/sinoe/authmfa/domain/user/TutorStudentRepository.java`
- `backend/src/main/java/com/sinoe/authmfa/domain/qa/QuestionRepository.java`
- `backend/src/main/java/com/sinoe/authmfa/domain/qa/AnswerRepository.java`
- `backend/src/main/java/com/sinoe/authmfa/domain/qa/QuestionMessageRepository.java`
- `backend/src/main/java/com/sinoe/authmfa/domain/qa/QuestionMessageRevisionRepository.java`
- `backend/src/main/java/com/sinoe/authmfa/domain/otp/OtpRepository.java`
- `backend/src/main/java/com/sinoe/authmfa/domain/audit/AuditLogRepository.java`

### Qué problema resuelve
Evita que la lógica de negocio acceda directamente a SQL o a detalles de JPA. Centraliza el acceso a datos y permite que la capa de servicios trabaje con una interfaz más estable.

### Cómo se aplica en TutorLink
TutorLink usa repositorios Spring Data JPA especializados por agregado o entidad. Los servicios de negocio dependen de ellos para:
- crear y consultar usuarios, estudiantes, tutores y asignaciones;
- gestionar preguntas, respuestas, mensajes y revisiones;
- almacenar OTPs y auditoría.

### Beneficios
- Separa persistencia de lógica de negocio.
- Facilita pruebas unitarias con mocks.
- Reduce acoplamiento con consultas SQL concretas.
- Aprovecha convenciones de Spring Data para mantener el código compacto.

### Consideraciones
El patrón está bien establecido, pero algunos repositorios contienen búsquedas muy específicas derivadas del dominio. Si el dominio crece más, convendría revisar si algunas consultas complejas deben pasar a componentes dedicados o especificaciones.

## Service Layer Pattern

### Tipo
Patrón de organización de código.

### Dónde aparece en el proyecto
- `backend/src/main/java/com/sinoe/authmfa/service/QaService.java`
- `backend/src/main/java/com/sinoe/authmfa/service/AdminUserService.java`
- `backend/src/main/java/com/sinoe/authmfa/service/UserService.java`
- `backend/src/main/java/com/sinoe/authmfa/service/TutorStudentAssignmentService.java`
- `backend/src/main/java/com/sinoe/authmfa/service/OtpService.java`
- `backend/src/main/java/com/sinoe/authmfa/service/EmailService.java`
- `backend/src/main/java/com/sinoe/authmfa/service/AuditService.java`

### Qué problema resuelve
Evita que los controladores REST concentren reglas de negocio, validaciones de dominio, manejo transaccional y orquestación entre repositorios.

### Cómo se aplica en TutorLink
Los controladores delegan a servicios la mayor parte del trabajo:
- `QaService` concentra preguntas, respuestas, conversación, historial y permisos de lectura/escritura.
- `AdminUserService` centraliza altas administrativas, importación CSV y cambios de estado.
- `OtpService` encapsula generación, validación y cooldown de OTP.
- `EmailService` y `AuditService` encapsulan infraestructura transversal.

### Beneficios
- Claridad en responsabilidades.
- Mejor testabilidad.
- Control transaccional más consistente.
- Facilita reutilización entre distintos controladores.

### Consideraciones
`QaService` ya concentra bastante comportamiento del dominio académico. Si el módulo sigue creciendo, podría dividirse en servicios más pequeños sin cambiar el contrato público.

## DTO Pattern

### Tipo
Patrón de transferencia de datos.

### Dónde aparece en el proyecto
- `backend/src/main/java/com/sinoe/authmfa/dto/AuthDtos.java`
- `backend/src/main/java/com/sinoe/authmfa/dto/QaDtos.java`
- `backend/src/main/java/com/sinoe/authmfa/dto/AdminUserDtos.java`
- `backend/src/main/java/com/sinoe/authmfa/dto/qa/*`
- `backend/src/main/java/com/sinoe/authmfa/dto/MeResponseDto.java`
- además de records internos en controladores como `AdminUserController.UserRow`

### Qué problema resuelve
Evita exponer entidades JPA directamente al frontend y permite modelar contratos específicos para cada caso de uso.

### Cómo se aplica en TutorLink
TutorLink usa DTOs para:
- autenticación y respuestas JWT;
- creación de preguntas, respuestas, reclasificación y rechazo;
- listados administrativos;
- historial de respuestas;
- conversación y revisiones del MVP de chat;
- datos del usuario autenticado (`/api/me`).

### Beneficios
- Protege el modelo de persistencia.
- Permite contratos JSON específicos y estables.
- Reduce riesgo de exponer campos sensibles.
- Facilita validación de entrada con anotaciones Jakarta Validation.

### Consideraciones
El patrón está bien establecido. Aun así, coexisten DTOs en clases contenedoras y records sueltos; a largo plazo podría homogenizarse el estilo, aunque no es un problema funcional.

## Dependency Injection

### Tipo
Patrón de inversión de dependencias / construcción de objetos.

### Dónde aparece en el proyecto
- En la mayoría de los controladores y servicios con `@RequiredArgsConstructor`
- `SecurityConfig`
- `JwtAuthFilter`
- servicios como `QaService`, `AdminUserService`, `AuditService`, `OtpService`, `RecaptchaService`

### Qué problema resuelve
Evita el acoplamiento fuerte a implementaciones concretas y deja a Spring la responsabilidad de construir y conectar dependencias.

### Cómo se aplica en TutorLink
Las dependencias se inyectan por constructor, generalmente con Lombok `@RequiredArgsConstructor`. Ejemplos:
- controladores que reciben servicios;
- servicios que reciben repositorios;
- `JwtAuthFilter` que recibe `JwtService`;
- `SecurityConfig` que recibe el filtro JWT.

### Beneficios
- Mejor desacoplamiento.
- Facilidad para pruebas con mocks.
- Configuración más clara y explícita.
- Consistencia con el ecosistema Spring.

### Consideraciones
TutorLink usa inyección de dependencias de forma consistente. En algunos servicios también se aprovecha `ObjectProvider<SelfType>` para pasar por el proxy transaccional de Spring, lo cual es útil, pero debe usarse con moderación para no ocultar flujos complejos.

## Builder

### Tipo
Patrón creacional.

### Dónde aparece en el proyecto
- Entidades JPA con Lombok `@Builder`, por ejemplo:
  - `User`
  - `Student`
  - `Tutor`
  - `Question`
  - `Answer`
  - `QuestionMessage`
  - `QuestionMessageRevision`
  - `AuditLog`
  - `OtpCode`
- DTOs y requests en `AuthDtos`, `AdminUserDtos` y otros paquetes

### Qué problema resuelve
Facilita la construcción de objetos con muchos campos opcionales o semánticamente distintos, sin depender de constructores largos y difíciles de leer.

### Cómo se aplica en TutorLink
El proyecto usa Lombok para generar builders en entidades y DTOs. Esto es visible, por ejemplo, cuando se crean:
- usuarios y perfiles;
- preguntas y respuestas;
- logs de auditoría;
- códigos OTP.

### Beneficios
- Mejora legibilidad al construir objetos complejos.
- Reduce errores por orden incorrecto de parámetros.
- Facilita evolución de clases con múltiples atributos.

### Consideraciones
Al usar Lombok `@Builder` sobre entidades JPA, hay que cuidar valores por defecto. De hecho, en `Tutor` ya aparecen advertencias de compilación sobre campos booleanos inicializados, lo que sugiere revisar `@Builder.Default` si se quiere preservar ese valor por defecto en el builder.

## Mapper / Transformación Entidad-DTO

### Tipo
Patrón de transformación de datos.

### Dónde aparece en el proyecto
- `backend/src/main/java/com/sinoe/authmfa/mapper/QaMapper.java`
- métodos privados de mapeo en `QaService`, por ejemplo:
  - `toQuestionSummary(...)`
  - `toTutorPendingQuestionDto(...)`
  - `toTutorRecentQuestionDto(...)`
  - `toTutorHistoryItem(...)`
  - `toConversationMessageDto(...)`

### Qué problema resuelve
Separa la estructura interna de las entidades respecto a la forma en que se entrega información a la API o a otros componentes.

### Cómo se aplica en TutorLink
Hay dos formas de aplicación:
1. Un mapper explícito (`QaMapper`) para ciertos DTOs del módulo de preguntas y respuestas.
2. Mapeo manual dentro de servicios, especialmente en `QaService`, donde la lógica de armado depende de reglas de negocio además de la transformación simple.

### Beneficios
- Aísla cambios entre dominio y contrato externo.
- Mejora claridad cuando una respuesta necesita composición adicional.
- Reduce repetición al transformar entidades similares.

### Consideraciones
El patrón existe de forma parcial y mixta. No todo el proyecto usa mappers dedicados; una parte importante del mapeo sigue embebida en servicios. Si se buscara mayor homogeneidad, podría estandarizarse entre mapper explícito o mapeo local por contexto.

## Adapter (uso parcial)

### Tipo
Patrón estructural.

### Dónde aparece en el proyecto
- `backend/src/main/java/com/sinoe/authmfa/service/RecaptchaService.java`
- en menor medida, `backend/src/main/java/com/sinoe/authmfa/service/EmailService.java`

### Qué problema resuelve
Permite aislar al resto del sistema de los detalles concretos de integración con servicios externos.

### Cómo se aplica en TutorLink
No existe un adapter formal con interfaz dedicada, pero sí una aproximación clara:
- `RecaptchaService` encapsula la llamada HTTP al endpoint de verificación de Google reCAPTCHA y expone una operación simple `verify(...)`.
- `EmailService` encapsula el uso de `JavaMailSender` y la construcción de correos HTML, exponiendo métodos más orientados al dominio del sistema.

### Beneficios
- Reduce acoplamiento con APIs externas.
- Facilita cambios futuros en la integración.
- Mejora legibilidad del código de controladores y servicios.

### Consideraciones
Se trata de un uso parcial del patrón, no de una implementación formal con interfaz y adaptadores intercambiables. Si en el futuro TutorLink necesitara múltiples proveedores de correo o CAPTCHA, convendría evolucionar esta idea hacia una abstracción más explícita.

## Patrones Revisados Que No Se Documentan Como Implementación Formal

- **Strategy**: no se observa una familia clara de comportamientos intercambiables seleccionados por interfaz común.
- **Factory**: aunque hay builders y métodos de creación, no hay una factoría explícita como patrón predominante.
- **Observer / Event-driven**: el envío de correos y auditoría ocurre por invocación directa desde servicios y controladores, no mediante un mecanismo desacoplado de publicación/suscripción.
- **Template Method**: no se aprecia una jerarquía orientada a pasos fijos redefinidos por subclases.

En otras palabras, TutorLink sí utiliza fuertemente Repository, Service Layer, DTO, Dependency Injection, Builder, Mapper y una aproximación parcial de Adapter, pero no muestra evidencia suficiente para afirmar formalmente los otros patrones en el estado actual del código.
