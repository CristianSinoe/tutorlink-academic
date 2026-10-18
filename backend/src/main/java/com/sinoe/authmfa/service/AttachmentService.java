package com.sinoe.authmfa.service;

import com.sinoe.authmfa.config.ApprovedAttachmentCatalog;
import com.sinoe.authmfa.dto.AttachmentDtos.*;
import com.sinoe.authmfa.security.InstitutionAccessService;
import static com.sinoe.authmfa.service.AttachmentAuthorizationService.*;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import java.util.List;
import java.util.Objects;
import java.util.function.Supplier;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class AttachmentService {
    private final AttachmentAuthorizationService authorization;
    private final AttachmentRepository repository;
    private final ApprovedAttachmentCatalog catalog;
    private final AuditService audit;
    private final Validator validator;
    private final TransactionTemplate transactions;

    public AttachmentService(AttachmentAuthorizationService authorization, AttachmentRepository repository,
            ApprovedAttachmentCatalog catalog, AuditService audit, Validator validator, PlatformTransactionManager manager) {
        this.authorization=authorization; this.repository=repository; this.catalog=catalog;
        this.audit=audit; this.validator=validator;
        transactions=new TransactionTemplate(manager);
        // Own the boundary so denied business events can be persisted after the operation has rolled back.
        transactions.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public Metadata create(Authentication authentication, ActingRole role, Create request) {
        return execute(authentication,role,"ATTACHMENT_CREATE",null,null,
                "resourceType="+safeType(request==null ? null : request.resourceType())+";resourceId="+(request==null ? null : request.resourceId()),() -> {
            validate(request); requireRole(role);
            ResourceType type=ResourceType.valueOf(request.resourceType());
            var parent=authorization.authorizeCreate(authentication,type,request.resourceId(),role);
            var entry=catalog.find(parent.institutionId(),request.url())
                    .orElseThrow(() -> new IllegalArgumentException("Referencia no aprobada para la institución"));
            if (!entry.fileName().equals(request.fileName())
                    || (request.mimeType()!=null && !Objects.equals(entry.mimeType(),request.mimeType()))
                    || (request.sizeBytes()!=null && !Objects.equals(entry.sizeBytes(),request.sizeBytes()))) {
                throw new IllegalArgumentException("Los metadatos no coinciden con la referencia aprobada");
            }
            repository.lockAuthorizationFacts(parent);
            parent=authorization.authorizeCreate(authentication,type,request.resourceId(),role);
            long id=repository.insert(parent,entry,request.title());
            var result=repository.metadata(parent.institutionId(),id).orElseThrow(AttachmentService::denied);
            audit.logSystem(parent.userId(),"ATTACHMENT_CREATED",true,null,detail(parent,id,null));
            return result;
        });
    }

    public Metadata metadata(Authentication authentication, long id, ActingRole role) {
        return execute(authentication,role,"ATTACHMENT_METADATA",id,null,() -> {
            requireId(id); requireRole(role);
            var permitted=authorization.authorizeReference(authentication,id,Operation.VIEW_METADATA,role,null);
            return repository.metadata(permitted.institutionId(),id).orElseThrow(AttachmentService::denied);
        });
    }

    public List<Metadata> list(Authentication authentication, ResourceType type, long resourceId, ActingRole role, int page, int size) {
        return execute(authentication,role,"ATTACHMENT_LIST",null,null,"resourceType="+type+";resourceId="+resourceId,() -> {
            requireId(resourceId); requireRole(role);
            if (type==null || page<0 || size<1 || size>100) throw new IllegalArgumentException("Paginación o recurso inválido");
            var parent=authorization.authorizeResourceMetadata(authentication,type,resourceId,role);
            var rows=repository.list(parent,page,size);
            for (var row : rows) {
                authorization.authorizeReference(authentication,row.id(),Operation.VIEW_METADATA,role,null);
            }
            return rows;
        });
    }

    public ContentReference contentReference(Authentication authentication, long id, ActingRole role) {
        return execute(authentication,role,"ATTACHMENT_CONTENT_REFERENCE",id,null,() -> {
            requireId(id); requireRole(role);
            var permitted=authorization.authorizeReference(authentication,id,Operation.VIEW_CONTENT_REFERENCE,role,null);
            var content=repository.content(permitted.institutionId(),id).orElseThrow(AttachmentService::denied);
            var entry=catalog.find(permitted.institutionId(),content.url())
                    .orElseThrow(() -> new Conflict("Referencia no verificada para consulta"));
            if (content.publicId()!=null || !entry.fileName().equals(content.fileName())
                    || !Objects.equals(entry.mimeType(),content.mimeType()) || !Objects.equals(entry.sizeBytes(),content.sizeBytes())) {
                throw new Conflict("Referencia no verificada para consulta");
            }
            audit.logSystem(permitted.userId(),"ATTACHMENT_CONTENT_REFERENCE_VIEWED",true,null,detail(permitted,id,null));
            return new ContentReference(id,entry.url());
        });
    }

    public void unlink(Authentication authentication, long id, ActingRole role, Unlink request) {
        execute(authentication,role,"ATTACHMENT_UNLINK",id,request==null ? null : request.reason(),() -> {
            requireId(id); requireRole(role); validate(request);
            var permitted=authorization.authorizeReference(authentication,id,Operation.UNLINK_REFERENCE,role,request.reason());
            repository.lockAuthorizationFacts(permitted);
            permitted=authorization.authorizeReference(authentication,id,Operation.UNLINK_REFERENCE,role,request.reason());
            if (repository.unlink(permitted,request.reason())!=1) throw new Conflict("Conflicto al desvincular la referencia");
            audit.logSystem(permitted.userId(),"ATTACHMENT_UNLINKED",true,null,detail(permitted,id,request.reason()));
            return null;
        });
    }

    private <T> T execute(Authentication authentication, ActingRole role, String action, Long id, String reason, Supplier<T> work) {
        return execute(authentication,role,action,id,reason,"",work);
    }

    private <T> T execute(Authentication authentication, ActingRole role, String action, Long id, String reason, String target, Supplier<T> work) {
        try {
            return transactions.execute(status -> work.get());
        } catch (RuntimeException ex) {
            // The business transaction has already rolled back, including authorization decision events.
            if (authentication!=null && authentication.isAuthenticated()
                    && authentication.getDetails() instanceof InstitutionAccessService.Access context
                    && context.user()!=null && context.user().getId()!=null) {
                try {
                    transactions.executeWithoutResult(status -> audit.logSystem(context.user().getId(),action,false,
                            ex instanceof AccessDeniedException ? "ACCESS_DENIED" : "OPERATION_REJECTED",
                            "institution="+context.institutionId()+";role="+role+";attachmentId="+id+";"+target+";reason="+safeReason(reason)));
                } catch (RuntimeException auditFailure) { ex.addSuppressed(auditFailure); }
            }
            if (ex instanceof ConcurrencyFailureException) throw new Conflict("Conflicto concurrente; vuelve a intentar la operación");
            throw ex;
        }
    }

    private <T> void validate(T value) {
        if (value==null) throw new IllegalArgumentException("Solicitud requerida");
        var errors=validator.validate(value);
        if (!errors.isEmpty()) throw new ConstraintViolationException(errors);
    }
    private static void requireRole(ActingRole role) {
        if (role==null) throw new IllegalArgumentException("Rol requerido");
    }
    private static void requireId(long id) {
        if (id<=0) throw new IllegalArgumentException("Identificador inválido");
    }
    private static AccessDeniedException denied() {
        return new AccessDeniedException("No tienes autorización sobre esta referencia de adjunto");
    }
    private static String detail(Authorization a, long id, String reason) {
        return "institution="+a.institutionId()+";role="+a.actingRole()+";resourceType="+a.resourceType()
                +";resourceId="+a.resourceId()+";attachmentId="+id+";reason="+safeReason(reason);
    }
    private static String safeType(String type) {
        try { return ResourceType.valueOf(type).name(); }
        catch (IllegalArgumentException | NullPointerException ex) { return "INVALID"; }
    }
    private static String safeReason(String reason) {
        return reason==null ? "" : reason.substring(0,Math.min(reason.length(),500))
                .replaceAll("(?i)(https?://|www\\.)\\S+","[REDACTED]").replaceAll("[\\r\\n\\t]"," ");
    }
    public static class Conflict extends RuntimeException {
        public Conflict(String message) { super(message); }
    }
}
