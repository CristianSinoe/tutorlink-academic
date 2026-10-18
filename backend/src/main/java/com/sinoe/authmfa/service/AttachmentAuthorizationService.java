package com.sinoe.authmfa.service;

import java.time.Clock;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import com.sinoe.authmfa.security.InstitutionAccessService;
import com.sinoe.authmfa.service.AttachmentAuthorizationRepository.Resource;

/** Validates a decision only. Callers must perform the authorized operation in the same unit of work. */
@Service
public class AttachmentAuthorizationService {
    public enum ResourceType { CONTENT, TASK, SUBMISSION }
    public enum Operation { VIEW_METADATA, VIEW_CONTENT_REFERENCE, CREATE_REFERENCE, UNLINK_REFERENCE }
    public enum ActingRole { DOCENTE, ESTUDIANTE, ADMIN, SUPER_ADMIN }
    public record Authorization(long userId, long institutionId, ResourceType resourceType,
                                long resourceId, Long attachmentId, Operation operation, ActingRole actingRole) { }
    private static final String DENIED = "No tienes autorización sobre esta referencia de adjunto";
    private final InstitutionAccessService accessService;
    private final AttachmentAuthorizationRepository repository;
    private final AuditService audit;
    private final Clock clock;

    @Autowired
    public AttachmentAuthorizationService(InstitutionAccessService accessService,
            AttachmentAuthorizationRepository repository, AuditService audit) {
        this(accessService, repository, audit, Clock.systemUTC());
    }

    public AttachmentAuthorizationService(InstitutionAccessService accessService,
            AttachmentAuthorizationRepository repository, AuditService audit, Clock clock) {
        this.accessService = accessService;
        this.repository = repository;
        this.audit = audit;
        this.clock = clock;
    }

    public Authorization authorizeCreate(Authentication authentication, ResourceType type, long resourceId, ActingRole role) {
        return authorize(authentication, type, resourceId, null, Operation.CREATE_REFERENCE, role, null);
    }

    /** Authorizes the parent even when it has no references; uses the same read policy. */
    public Authorization authorizeResourceMetadata(Authentication authentication, ResourceType type, long resourceId, ActingRole role) {
        return authorize(authentication, type, resourceId, null, Operation.VIEW_METADATA, role, null);
    }

    public Authorization authorizeReference(Authentication authentication, long attachmentId,
            Operation operation, ActingRole role, String reason) {
        return authorize(authentication, null, 0, attachmentId, operation, role, reason);
    }

    private Authorization authorize(Authentication authentication, ResourceType type, long resourceId,
            Long attachmentId, Operation operation, ActingRole role, String reason) {
        Long actor = null;
        Long institution = null;
        boolean success = false;
        try {
            if (authentication == null || !authentication.isAuthenticated()
                    || !(authentication.getDetails() instanceof InstitutionAccessService.Access context)
                    || context.user() == null) throw denied();
            actor = context.user().getId();
            institution = context.institutionId();
            if (actor == null || institution == null || context.user().getAuthorizationVersion() == null) throw denied();
            var access = accessService.resolve(actor, institution, context.user().getAuthorizationVersion());
            if (role == null || operation == null || !access.roles().contains(role.name())) throw denied();
            if (attachmentId != null) {
                if (attachmentId <= 0 || operation == Operation.CREATE_REFERENCE) throw denied();
                var ref = repository.reference(institution, attachmentId).orElseThrow(AttachmentAuthorizationService::denied);
                int count = (ref.contentId() == null ? 0 : 1) + (ref.taskId() == null ? 0 : 1)
                        + (ref.submissionId() == null ? 0 : 1);
                if (count != 1) throw denied();
                type = ref.contentId() != null ? ResourceType.CONTENT
                        : ref.taskId() != null ? ResourceType.TASK : ResourceType.SUBMISSION;
                resourceId = ref.contentId() != null ? ref.contentId()
                        : ref.taskId() != null ? ref.taskId() : ref.submissionId();
            }
            if (type == null || resourceId <= 0) throw denied();
            Resource resource = repository.resource(institution, actor, type, resourceId)
                    .orElseThrow(AttachmentAuthorizationService::denied);
            if (!allowed(actor, type, resource, operation, role, reason)) throw denied();
            success = true;
            return new Authorization(actor, institution, type, resourceId, attachmentId, operation, role);
        } catch (AccessDeniedException ex) {
            throw denied();
        } finally {
            // This event describes authorization, never a completed attachment mutation.
            if (actor != null && (operation == Operation.CREATE_REFERENCE || operation == Operation.UNLINK_REFERENCE
                    || operation == Operation.VIEW_CONTENT_REFERENCE || role == ActingRole.SUPER_ADMIN)) {
                String detail = "institution=" + institution + ";role=" + role + ";resourceType=" + type
                        + ";resourceId=" + resourceId + ";attachmentId=" + attachmentId;
                // Do not log arbitrary free text (it could contain private provider URLs).
                if (role == ActingRole.ADMIN || role == ActingRole.SUPER_ADMIN) {
                    detail += ";reason=" + safeReason(reason);
                }
                audit.logSystem(actor, "ATTACHMENT_AUTHORIZATION_" + operation, success,
                        success ? null : "ACCESS_DENIED", detail);
            }
        }
    }

    private boolean allowed(long actor, ResourceType type, Resource r, Operation op, ActingRole role, String reason) {
        boolean read = op == Operation.VIEW_METADATA || op == Operation.VIEW_CONTENT_REFERENCE;
        if (role == ActingRole.ADMIN || role == ActingRole.SUPER_ADMIN) {
            return op == Operation.VIEW_METADATA || (op == Operation.UNLINK_REFERENCE
                    && reason != null && !reason.isBlank() && reason.length() <= 500);
        }
        if (role == ActingRole.DOCENTE) {
            if (!r.teacherAssigned()) return false;
            if (type == ResourceType.SUBMISSION) {
                return read && r.ownerEnrolled() && ("ON_TIME".equals(r.status()) || "LATE".equals(r.status()));
            }
            return actor == r.authorUserId() || (read && r.published());
        }
        if (role != ActingRole.ESTUDIANTE || !r.studentEnrolled()) return false;
        if (type != ResourceType.SUBMISSION) return read && r.published();
        if (!Objects.equals(r.ownerUserId(), actor) || !r.ownerEnrolled()
                || !("DRAFT".equals(r.status()) || "ON_TIME".equals(r.status()) || "LATE".equals(r.status()))) return false;
        if (read) return true;
        return "DRAFT".equals(r.status()) && r.published() && r.dueAt() != null
                && (!clock.instant().isAfter(r.dueAt()) || r.allowLate());
    }

    private static String safeReason(String reason) {
        if (reason == null) return "";
        return reason.substring(0, Math.min(reason.length(), 500))
                .replaceAll("(?i)(https?://|www\\.)\\S+", "[REDACTED]")
                .replaceAll("[\\r\\n\\t]", " ");
    }

    private static AccessDeniedException denied() { return new AccessDeniedException(DENIED); }
}
