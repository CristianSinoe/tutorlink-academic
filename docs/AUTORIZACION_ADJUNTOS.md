# Autorización y referencias de adjuntos — fases 1.4.2 y 1.4.3

`AttachmentAuthorizationService` valida decisiones; no crea ni desvincula referencias y no devuelve URLs. No incorpora endpoints ni un proveedor de archivos.

## Uso

- `authorizeCreate(authentication, ResourceType, resourceId, ActingRole)` valida el recurso padre antes de crear una referencia.
- `authorizeReference(authentication, attachmentId, Operation, ActingRole, reason)` valida una referencia activa para `VIEW_METADATA`, `VIEW_CONTENT_REFERENCE` o `UNLINK_REFERENCE`.
- `CREATE_REFERENCE` no se admite en `authorizeReference`.
- `authorizeResourceMetadata(authentication, ResourceType, resourceId, ActingRole)` aplica la misma política de metadatos al padre; permite autorizar listados sin adjuntos.
- `ResourceType` admite `CONTENT`, `TASK` y `SUBMISSION`; una clase corresponde a su contenido, no a `tl_class_sessions`.
- `ActingRole` se selecciona explícitamente: `DOCENTE`, `ESTUDIANTE`, `ADMIN` o `SUPER_ADMIN`. La selección no concede autoridad ni permite cambiar de institución.

Los consumidores deben pasar la autenticación producida por Spring Security, con los detalles `InstitutionAccessService.Access`. El servicio revalida la versión de autorización, el estado del usuario, la institución y las membresías en base de datos. Las autoridades antiguas del token no sustituyen esa validación.

El resultado `Authorization` contiene actor, institución, recurso, referencia opcional, operación y rol. No es un permiso persistente ni transferible: el consumidor futuro debe ejecutar su operación en la misma unidad de trabajo y protegerse de cambios concurrentes en autorización o estado. Para crear, debe utilizar el actor y la institución devueltos; para consultar, debe mantener el filtro institucional y no desvinculado.

## Reglas

| Contexto | Consulta | Crear/desvincular |
| --- | --- | --- |
| Docente autor asignado | Material propio publicado o borrador | Material propio |
| Otro docente asignado | Material publicado | Denegado |
| Docente asignado, entrega | ON_TIME/LATE de estudiante inscrito | Denegado |
| Estudiante inscrito, material | Publicado | Denegado |
| Estudiante inscrito, entrega propia | DRAFT/ON_TIME/LATE | Solo DRAFT, tarea publicada y plazo permitido |
| ADMIN/SUPER_ADMIN institucional | Solo metadatos | Solo desvinculación administrativa justificada |

La asignación docente está vigente mientras exista la relación docente–grupo. La inscripción exige `ACTIVE`. La autoría por sí sola no concede permisos. Se verifican grupo, curso, periodo, autor y propietario en la institución activa. Toda relación ausente o inconsistente se deniega.

Las modificaciones estudiantiles se permiten hasta `dueAt` inclusive, usando reloj UTC del servidor. Después requieren `allowLateSubmissions=true`. Una entrega final siempre queda bloqueada para edición académica. La consulta propia no depende del vencimiento ni de que la tarea siga publicada, pero exige inscripción vigente. Otros estudiantes no acceden a entregas ajenas.

El ADMIN o SUPER_ADMIN puede autorizar una desvinculación excepcional incluso de una entrega final, con motivo no vacío de hasta 500 caracteres y auditoría. Esto no modifica la entrega ni concede contenido privado. Un rol académico explícito requiere su propia membresía y todas sus relaciones verificadas, incluso en cuentas administrativas.

SUPER_ADMIN necesita contexto institucional explícito. Actualmente los servicios de membresías impiden otorgarle nuevas membresías institucionales: sin una membresía académica previamente autorizada, su acceso académico se deniega. No se cambia el JWT ni se habilitan nuevas asignaciones en esta fase.

## Metadatos y auditoría

`AttachmentDtos.Metadata` es la proyección administrativa: no contiene `url` ni `publicId`. El DTO `View` se conserva para futuros consumidores que autoricen expresamente `VIEW_CONTENT_REFERENCE`; nunca debe usarse como respuesta administrativa.

Los eventos `ATTACHMENT_AUTHORIZATION_*` de `AuditService.logSystem` describen decisiones, no operaciones consumadas. Registran actor, institución, rol, recurso, adjunto y resultado para creación, desvinculación, consulta privada y decisiones con rol SUPER_ADMIN, incluidos rechazos identificables. El motivo administrativo se registra con URLs redactadas y sin saltos de línea. No se consultan ni registran URLs o identificadores del proveedor. Si la auditoría falla, la llamada no devuelve una autorización.

V29 conserva los campos de desvinculación efectiva (`unlinked_at`, `unlinked_by_user_id`, `unlink_reason`). `AttachmentService` los actualiza sin eliminar el registro, conserva el motivo completo y registra el resultado. El servicio central de autorización no modifica esos campos.

## Verificación

Las pruebas de servicio usan JUnit 5/Mockito y un reloj fijo; las de contexto ejecutan el resolver existente con repositorios simulados. El contrato SQL se ejecuta con H2 en modo PostgreSQL y, con Docker disponible, con PostgreSQL 16 mediante Testcontainers. El fixture SQL de contrato es deliberadamente mínimo; no sustituye una prueba de todas las migraciones.

Desde `backend`: `mvn -o '-Dtest=AttachmentAuthorization*Test' test` y `mvn -o test`. Los tests PostgreSQL se omiten cuando Docker no está disponible.

## API de referencias — fase 1.4.3

Cada petición requiere JWT contextual y `actingRole=DOCENTE|ESTUDIANTE|ADMIN|SUPER_ADMIN`, seleccionado explícitamente. El parámetro no concede permisos. La institución y el actor se obtienen únicamente del contexto autenticado y se revalidan contra la base de datos.

| Método / ruta | Entrada | Respuesta |
| --- | --- | --- |
| `POST /api/attachments?actingRole=DOCENTE` | `AttachmentDtos.Create` | 201, `Location` y `Metadata` |
| `GET /api/attachments/{id}?actingRole=ADMIN` | Identificador positivo | 200, `Metadata` |
| `GET /api/attachments?actingRole=ESTUDIANTE&resourceType=CONTENT&resourceId=30&page=0&size=20` | Recurso concreto y paginación | 200, lista de `Metadata` |
| `GET /api/attachments/{id}/content-reference?actingRole=DOCENTE` | Identificador positivo | 200, `ContentReference`: `{id,url}` |
| `POST /api/attachments/{id}/unlink?actingRole=ADMIN` | `AttachmentDtos.Unlink` | 204, sin cuerpo |

El listado autoriza primero el padre y después cada referencia. El recurso autorizado sin adjuntos devuelve `[]`; no se devuelve una lista vacía para ocultar una denegación. Las listas contienen solo referencias activas, ordenadas por id ascendente. `page` empieza en cero; `size` admite 1–100 y vale 20 por defecto. No hay búsqueda global ni endpoint para el historial desvinculado.

Registro, detalle y listado utilizan exclusivamente `Metadata`, sin `url` ni `publicId`, incluso para roles académicos. La consulta de URL exige `VIEW_CONTENT_REFERENCE` y procedencia aprobada; ADMIN y SUPER_ADMIN administrativos nunca la obtienen. Los errores de estas rutas usan `{message}` y no incluyen SQL, URLs ni excepciones internas: 400 entrada inválida; 401 autenticación ausente/inválida; 403 uniforme para recurso inexistente, ajeno, desvinculado o no autorizado; 409 referencia no verificada o conflicto concurrente; 500 error interno sanitizado.

### Catálogo público temporal

El único origen permitido para nuevos registros es `tutorlink.attachments.approved-references`, configurado por operadores del servidor. Está vacío por defecto: sin entradas no se registran referencias ni se exponen URLs. No existe endpoint para añadir entradas al catálogo. Ejemplo ilustrativo, que debe sustituirse por referencias públicas revisadas de la institución real:

```yaml
tutorlink:
  attachments:
    approved-references:
      - institution-id: 1
        url: https://materiales.example.edu/guia.pdf
        file-name: guia.pdf
        mime-type: application/pdf
        size-bytes: 1024
```

Institución, URL y nombre de archivo son obligatorios; MIME y tamaño son opcionales. La configuración se valida al iniciar: institución positiva, HTTPS, host, ausencia de credenciales en autoridad y fragmentos, límites de 2000 caracteres para URL, 255 para nombre, 150 para MIME, formato MIME y tamaño no negativo. Se rechazan entradas duplicadas dentro de una institución. La misma URL puede aprobarse separadamente para distintas instituciones.

El operador debe verificar que el enlace es público, permanente y no contiene credenciales, tokens o firmas temporales, y revisar su vigencia. El backend no hace peticiones externas ni comprueba que el servidor remoto continúe publicando el archivo. No se implementa carga, propiedad externa, descarga mediada, firma de URLs ni protección de archivos privados. El catálogo es una aprobación operativa de procedencia pública, adicional a la autorización académica; no sustituye permisos.

El registro recibe tipo (`CONTENT`, `TASK`, `SUBMISSION`), recurso positivo, nombre de archivo y URL exacta. No se normalizan ni aceptan variantes de la URL aprobada. `publicId` debe omitirse o ser null. Título opcional: máximo 200 caracteres; MIME opcional: formato tipo/subtipo y máximo 150; tamaño opcional: no negativo. Nombre, MIME y tamaño proporcionados deben coincidir con el catálogo; MIME y tamaño omitidos se completan desde la entrada canónica. Se persisten institución y cargador desde el resultado autorizado. `uploader_user_id` identifica al usuario que registra la referencia, no prueba que haya subido o creado el archivo externo.

Las referencias antiguas ajenas al catálogo siguen admitiendo metadatos y desvinculación autorizados. La ruta de contenido responde 409 si la URL o sus metadatos no coinciden con el catálogo institucional, o si existe `public_id`. Retirar una entrada del catálogo bloquea nuevos registros y la exposición de esa URL, sin borrar el historial. Cloudinary y el acceso seguro a archivos privados quedan para otra fase.

### Transacciones y auditoría de negocio

`AttachmentService` delimita una transacción por operación. Las modificaciones bloquean usuario, institución, membresías, recurso padre y relaciones académicas relevantes; las entregas bloquean tarea y entrega, y la desvinculación también su referencia. Los bloqueos institucionales son exclusivos: priorizan consistencia en esta fase y serializan las modificaciones de adjuntos dentro de una institución. Después de adquirirlos se vacía el contexto JPA y se vuelve a invocar la autorización central para leer hechos vigentes, no entidades almacenadas en caché.

La desvinculación usa un UPDATE institucional condicionado a `unlinked_at IS NULL`, conserva fecha, actor y motivo completo, y no borra archivos externos. Una segunda desvinculación devuelve 403 porque la referencia ya no está activa. No se agregan endpoints de reemplazo o reapertura de entregas finales.

Los eventos `ATTACHMENT_CREATED`, `ATTACHMENT_UNLINKED` y `ATTACHMENT_CONTENT_REFERENCE_VIEWED` describen operaciones de negocio completadas, separadas de `ATTACHMENT_AUTHORIZATION_*`. Los éxitos se guardan dentro de la misma transacción. Si falla la auditoría de éxito se revierte la operación. Los rechazos identificables se registran con eventos `ATTACHMENT_CREATE`, `ATTACHMENT_UNLINK`, `ATTACHMENT_METADATA`, `ATTACHMENT_LIST` o `ATTACHMENT_CONTENT_REFERENCE`, con `success=false`, después del rollback y en una transacción independiente. Se conservan actor, institución, rol, identificadores disponibles y motivo redactado, sin URLs ni datos del proveedor. Un fallo de esa auditoría no convierte el rechazo en permiso. Conflictos de bloqueo devuelven 409; el cliente puede volver a intentar tras comprobar el estado vigente.

### Pruebas

`AttachmentHttpH2Test` ejecuta la cadena real de seguridad, JWT, autorización, JPA/JDBC y respuestas HTTP. Su fixture adapta únicamente tipos de PostgreSQL para H2 y crea el dominio `user_status`; no modifica migraciones. Incluye catálogo, roles, aislamiento, paginación, entregas, auditoría, rollback y revalidación concurrente de versión de autorización.

`AttachmentHttpPostgresTest` ejecuta el mismo contrato HTTP con Flyway y migraciones reales en PostgreSQL 16, más una carrera de finalización de entrega frente a desvinculación. Se omite explícitamente si Docker no está disponible; no se debe declarar aprobado en ese caso.

Desde la raíz: `mvn -o -f backend/pom.xml '-Dtest=AttachmentHttp*Test,ApprovedAttachmentCatalogTest,AttachmentAuthorization*Test' test` y `mvn -o -f backend/pom.xml test`.

## Compatibilidad con V30

Los perfiles ahora son independientes por usuario e institución. El servicio central de adjuntos conserva sus reglas y consultas institucionales. Suspender o revocar una membresía retira ese rol en su contexto sin desactivar la cuenta ni invalidar contextos válidos de otras instituciones. V30 y los endpoints de perfiles/invitaciones se documentan en `CONTRATO_API_CURSOS.md`.
