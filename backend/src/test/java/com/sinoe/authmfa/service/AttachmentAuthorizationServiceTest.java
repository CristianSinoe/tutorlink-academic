package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.dto.AttachmentDtos;
import com.sinoe.authmfa.security.InstitutionAccessService;
import com.sinoe.authmfa.service.AttachmentAuthorizationRepository.Reference;
import com.sinoe.authmfa.service.AttachmentAuthorizationRepository.Resource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import static com.sinoe.authmfa.service.AttachmentAuthorizationService.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttachmentAuthorizationServiceTest {
    @Mock InstitutionAccessService access;
    @Mock AttachmentAuthorizationRepository repository;
    @Mock AuditService audit;
    AttachmentAuthorizationService service;
    Authentication authentication;
    final Instant now = Instant.parse("2026-10-11T18:00:00Z");

    @BeforeEach void setup() {
        service = new AttachmentAuthorizationService(access, repository, audit, Clock.fixed(now, ZoneOffset.UTC));
        authentication = auth(10L, 1L);
    }

    Authentication auth(Long actor, Long institution) {
        User user = User.builder().id(actor).authorizationVersion(1L).build();
        var token = new UsernamePasswordAuthenticationToken("user@example.com", null, java.util.List.of());
        token.setDetails(new InstitutionAccessService.Access(user, institution, Set.of()));
        return token;
    }

    void roles(ActingRole... roles) {
        when(access.resolve(10L, 1L, 1L)).thenReturn(new InstitutionAccessService.Access(
                ((InstitutionAccessService.Access) authentication.getDetails()).user(), 1L,
                Arrays.stream(roles).map(Enum::name).collect(java.util.stream.Collectors.toSet())));
    }

    Resource material(boolean author, boolean published, boolean assigned, boolean enrolled) {
        return new Resource(author ? 10L : 20L, null, published, null, null, false, assigned, enrolled, false);
    }
    Resource submission(Long owner, String status, Instant due, boolean late, boolean assigned, boolean enrolled) {
        return new Resource(20L, owner, true, status, due, late, assigned, enrolled, true);
    }
    void resource(ResourceType type, Resource value) {
        when(repository.resource(1L, 10L, type, 30L)).thenReturn(Optional.of(value));
    }
    Authorization invoke(ResourceType type, Operation op, ActingRole role, String reason) {
        if (op == Operation.CREATE_REFERENCE) return service.authorizeCreate(authentication, type, 30L, role);
        when(repository.reference(1L, 40L)).thenReturn(Optional.of(new Reference(
                type == ResourceType.CONTENT ? 30L : null, type == ResourceType.TASK ? 30L : null,
                type == ResourceType.SUBMISSION ? 30L : null)));
        return service.authorizeReference(authentication, 40L, op, role, reason);
    }

    @ParameterizedTest @EnumSource(Operation.class)
    void assignedAuthorCanManageMaterial(Operation op) {
        roles(ActingRole.DOCENTE); resource(ResourceType.CONTENT, material(true, false, true, false));
        assertEquals(10L, invoke(ResourceType.CONTENT, op, ActingRole.DOCENTE, null).userId());
    }
    @ParameterizedTest @EnumSource(Operation.class)
    void authorshipWithoutAssignmentNeverGrantsAccess(Operation op) {
        roles(ActingRole.DOCENTE); resource(ResourceType.TASK, material(true, true, false, false));
        assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.TASK, op, ActingRole.DOCENTE, null));
    }
    @ParameterizedTest @EnumSource(Operation.class)
    void colleagueCanOnlyReadPublishedMaterials(Operation op) {
        roles(ActingRole.DOCENTE); resource(ResourceType.TASK, material(false, true, true, false));
        if (op == Operation.VIEW_METADATA || op == Operation.VIEW_CONTENT_REFERENCE)
            assertDoesNotThrow(() -> invoke(ResourceType.TASK, op, ActingRole.DOCENTE, null));
        else assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.TASK, op, ActingRole.DOCENTE, null));
    }
    @Test void colleagueCannotReadDraft() {
        roles(ActingRole.DOCENTE); resource(ResourceType.CONTENT, material(false, false, true, false));
        assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.CONTENT, Operation.VIEW_METADATA, ActingRole.DOCENTE, null));
    }
    @ParameterizedTest @EnumSource(ResourceType.class)
    void unenrolledStudentCannotAccessResources(ResourceType type) {
        roles(ActingRole.ESTUDIANTE);
        resource(type, type == ResourceType.SUBMISSION ? submission(10L, "DRAFT", now, false, false, false)
                : material(false, true, false, false));
        assertThrows(AccessDeniedException.class, () -> invoke(type, Operation.VIEW_CONTENT_REFERENCE, ActingRole.ESTUDIANTE, null));
    }
    @ParameterizedTest @EnumSource(Operation.class)
    void enrolledStudentOnlyReadsPublishedMaterial(Operation op) {
        roles(ActingRole.ESTUDIANTE); resource(ResourceType.CONTENT, material(false, true, false, true));
        if (op == Operation.VIEW_METADATA || op == Operation.VIEW_CONTENT_REFERENCE)
            assertDoesNotThrow(() -> invoke(ResourceType.CONTENT, op, ActingRole.ESTUDIANTE, null));
        else assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.CONTENT, op, ActingRole.ESTUDIANTE, null));
    }
    @Test void studentCannotReadUnpublishedTask() {
        roles(ActingRole.ESTUDIANTE); resource(ResourceType.TASK, material(false, false, false, true));
        assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.TASK, Operation.VIEW_METADATA, ActingRole.ESTUDIANTE, null));
    }
    @ParameterizedTest @EnumSource(Operation.class)
    void studentsNeverAccessPeersSubmissions(Operation op) {
        roles(ActingRole.ESTUDIANTE); resource(ResourceType.SUBMISSION, submission(99L, "ON_TIME", now, true, false, true));
        assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.SUBMISSION, op, ActingRole.ESTUDIANTE, null));
    }
    @ParameterizedTest @EnumSource(Operation.class)
    void ownDraftCanBeManagedAtDeadline(Operation op) {
        roles(ActingRole.ESTUDIANTE); resource(ResourceType.SUBMISSION, submission(10L, "DRAFT", now, false, false, true));
        assertDoesNotThrow(() -> invoke(ResourceType.SUBMISSION, op, ActingRole.ESTUDIANTE, null));
    }
    @ParameterizedTest @EnumSource(Operation.class)
    void expiredDraftOnlyAllowsReading(Operation op) {
        roles(ActingRole.ESTUDIANTE); resource(ResourceType.SUBMISSION, submission(10L, "DRAFT", now.minusSeconds(1), false, false, true));
        if (op == Operation.VIEW_METADATA || op == Operation.VIEW_CONTENT_REFERENCE)
            assertDoesNotThrow(() -> invoke(ResourceType.SUBMISSION, op, ActingRole.ESTUDIANTE, null));
        else assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.SUBMISSION, op, ActingRole.ESTUDIANTE, null));
    }
    @ParameterizedTest @EnumSource(value=Operation.class, names={"CREATE_REFERENCE", "UNLINK_REFERENCE"})
    void draftsEditableBeforeDeadlineOrWhenLateAllowed(Operation op) {
        roles(ActingRole.ESTUDIANTE);
        for (Resource r : java.util.List.of(submission(10L,"DRAFT",now.plusSeconds(1),false,false,true),
                submission(10L,"DRAFT",now.minusSeconds(1),true,false,true))) {
            resource(ResourceType.SUBMISSION,r);
            assertDoesNotThrow(() -> invoke(ResourceType.SUBMISSION,op,ActingRole.ESTUDIANTE,null));
        }
    }
    @ParameterizedTest @EnumSource(Operation.class)
    void finalSubmissionsAreReadOnlyForOwnerAndAssignedTeacher(Operation op) {
        roles(ActingRole.ESTUDIANTE, ActingRole.DOCENTE);
        for (String status : java.util.List.of("ON_TIME", "LATE")) {
            resource(ResourceType.SUBMISSION, submission(10L, status, now, true, true, true));
            for (ActingRole role : java.util.List.of(ActingRole.ESTUDIANTE, ActingRole.DOCENTE)) {
                if (op == Operation.VIEW_METADATA || op == Operation.VIEW_CONTENT_REFERENCE)
                    assertDoesNotThrow(() -> invoke(ResourceType.SUBMISSION, op, role, null));
                else assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.SUBMISSION, op, role, null));
            }
        }
    }
    @Test void teacherCannotReadStudentDraftOrWithdrawnOwnersSubmission() {
        roles(ActingRole.DOCENTE);
        resource(ResourceType.SUBMISSION, submission(99L, "DRAFT", now, true, true, false));
        assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.SUBMISSION, Operation.VIEW_METADATA, ActingRole.DOCENTE, null));
        resource(ResourceType.SUBMISSION, new Resource(20L,99L,true,"ON_TIME",now,true,true,false,false));
        assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.SUBMISSION, Operation.VIEW_METADATA, ActingRole.DOCENTE, null));
    }
    @ParameterizedTest @EnumSource(value=ActingRole.class, names={"ADMIN","SUPER_ADMIN"})
    void administrativeAccessDoesNotGrantPrivateContent(ActingRole role) {
        roles(role); resource(ResourceType.SUBMISSION, submission(99L, "ON_TIME", now, false, false, false));
        assertDoesNotThrow(() -> invoke(ResourceType.SUBMISSION, Operation.VIEW_METADATA, role, null));
        assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.SUBMISSION, Operation.VIEW_CONTENT_REFERENCE, role, null));
        assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.SUBMISSION, Operation.CREATE_REFERENCE, role, null));
        assertDoesNotThrow(() -> invoke(ResourceType.SUBMISSION, Operation.UNLINK_REFERENCE, role, "Retiro administrativo"));
        for (String reason : new String[]{null, "", "  ", "x".repeat(501)})
            assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.SUBMISSION, Operation.UNLINK_REFERENCE, role, reason));
    }
    @ParameterizedTest @EnumSource(value=ActingRole.class, names={"ADMIN","SUPER_ADMIN"})
    void combinedRolesRequireExplicitAcademicMembershipAndRelationship(ActingRole admin) {
        roles(admin, ActingRole.DOCENTE); resource(ResourceType.TASK, material(true, false, true, false));
        assertDoesNotThrow(() -> invoke(ResourceType.TASK, Operation.VIEW_CONTENT_REFERENCE, ActingRole.DOCENTE, null));
        assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.TASK, Operation.VIEW_CONTENT_REFERENCE, admin, null));
        resource(ResourceType.TASK, material(true, false, false, false));
        assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.TASK, Operation.VIEW_CONTENT_REFERENCE, ActingRole.DOCENTE, null));
        roles(admin);
        assertThrows(AccessDeniedException.class, () -> service.authorizeCreate(authentication, ResourceType.TASK, 30L, ActingRole.DOCENTE));
    }
    @Test void combinedAdminStudentCanOnlyReadOwnSubmission() {
        roles(ActingRole.ADMIN,ActingRole.ESTUDIANTE);
        resource(ResourceType.SUBMISSION,submission(10L,"ON_TIME",now,false,false,true));
        assertDoesNotThrow(() -> invoke(ResourceType.SUBMISSION,Operation.VIEW_CONTENT_REFERENCE,ActingRole.ESTUDIANTE,null));
        resource(ResourceType.SUBMISSION,submission(99L,"ON_TIME",now,false,false,true));
        assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.SUBMISSION,Operation.VIEW_CONTENT_REFERENCE,ActingRole.ESTUDIANTE,null));
    }
    @Test void nullOrUntrustedAuthenticationAndMissingInstitutionAreDenied() {
        for (Authentication token : new Authentication[]{null, new UsernamePasswordAuthenticationToken("u", "p"), auth(10L,null)})
            assertThrows(AccessDeniedException.class, () -> service.authorizeCreate(token,ResourceType.CONTENT,30L,ActingRole.SUPER_ADMIN));
        verifyNoInteractions(repository,access);
    }
    @Test void contextRevalidationFailureHasUniformDenial() {
        when(access.resolve(10L,1L,1L)).thenThrow(new AccessDeniedException("revoked, inactive or obsolete"));
        assertEquals("No tienes autorización sobre esta referencia de adjunto", assertThrows(AccessDeniedException.class,
                () -> service.authorizeCreate(authentication,ResourceType.CONTENT,30L,ActingRole.DOCENTE)).getMessage());
        verifyNoInteractions(repository);
    }
    @Test void missingOrForeignResourceDenied() {
        roles(ActingRole.ADMIN);
        when(repository.reference(1L,40L)).thenReturn(Optional.empty());
        assertThrows(AccessDeniedException.class, () -> service.authorizeReference(authentication,40L,Operation.VIEW_METADATA,ActingRole.ADMIN,null));
        when(repository.resource(1L,10L,ResourceType.CONTENT,30L)).thenReturn(Optional.empty());
        assertThrows(AccessDeniedException.class, () -> service.authorizeCreate(authentication,ResourceType.CONTENT,30L,ActingRole.ADMIN));
    }
    @Test void malformedReferenceDenied() {
        roles(ActingRole.ADMIN);
        for (Reference reference : java.util.List.of(new Reference(null,null,null),new Reference(30L,31L,null))) {
            when(repository.reference(1L,40L)).thenReturn(Optional.of(reference));
            assertThrows(AccessDeniedException.class, () -> service.authorizeReference(authentication,40L,Operation.VIEW_METADATA,ActingRole.ADMIN,null));
        }
    }
    @Test void auditsDecisionsAndRedactsUrls() {
        roles(ActingRole.ADMIN); resource(ResourceType.CONTENT,material(false,true,false,false));
        invoke(ResourceType.CONTENT,Operation.UNLINK_REFERENCE,ActingRole.ADMIN,"Retirar https://private.example/token");
        verify(audit).logSystem(eq(10L),eq("ATTACHMENT_AUTHORIZATION_UNLINK_REFERENCE"),eq(true),isNull(),
                argThat(s -> s.contains("institution=1") && s.contains("attachmentId=40") && s.contains("Retirar") && !s.contains("private.example")));
    }
    @Test void invalidOperationAndMissingRoleDenied() {
        roles(ActingRole.ADMIN);
        assertThrows(AccessDeniedException.class, () -> service.authorizeReference(authentication,40L,Operation.CREATE_REFERENCE,ActingRole.ADMIN,null));
        assertThrows(AccessDeniedException.class, () -> service.authorizeReference(authentication,40L,null,ActingRole.ADMIN,null));
        assertThrows(AccessDeniedException.class, () -> service.authorizeCreate(authentication,null,30L,ActingRole.ADMIN));
        assertThrows(AccessDeniedException.class, () -> service.authorizeCreate(authentication,ResourceType.CONTENT,30L,null));
    }
    @Test void administrativeMetadataCannotCarryPrivateFields() {
        Set<String> fields = Arrays.stream(AttachmentDtos.Metadata.class.getRecordComponents()).map(java.lang.reflect.RecordComponent::getName)
                .collect(java.util.stream.Collectors.toSet());
        assertFalse(fields.contains("url")); assertFalse(fields.contains("publicId"));
    }

    @Test void missingAssignmentDeniesTeacherAccessToFinalSubmission() {
        roles(ActingRole.DOCENTE);
        resource(ResourceType.SUBMISSION,submission(99L,"ON_TIME",now,false,false,true));
        assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.SUBMISSION,
                Operation.VIEW_CONTENT_REFERENCE,ActingRole.DOCENTE,null));
    }

    @Test void unpublishedTaskBlocksDraftChangesButPreservesOwnReadAccess() {
        roles(ActingRole.ESTUDIANTE);
        resource(ResourceType.SUBMISSION,new Resource(20L,10L,false,"DRAFT",now,true,false,true,true));
        assertDoesNotThrow(() -> invoke(ResourceType.SUBMISSION,Operation.VIEW_METADATA,ActingRole.ESTUDIANTE,null));
        assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.SUBMISSION,
                Operation.CREATE_REFERENCE,ActingRole.ESTUDIANTE,null));
    }

    @Test void unverifiableSubmissionStateOrDeadlineDeniesChanges() {
        roles(ActingRole.ESTUDIANTE);
        resource(ResourceType.SUBMISSION,submission(10L,"UNKNOWN",now,true,false,true));
        assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.SUBMISSION,
                Operation.VIEW_METADATA,ActingRole.ESTUDIANTE,null));
        resource(ResourceType.SUBMISSION,submission(10L,"DRAFT",null,true,false,true));
        assertThrows(AccessDeniedException.class, () -> invoke(ResourceType.SUBMISSION,
                Operation.CREATE_REFERENCE,ActingRole.ESTUDIANTE,null));
    }

    @Test void deniedSensitiveDecisionIsAuditedWithoutSuccessClaim() {
        roles(ActingRole.SUPER_ADMIN);
        assertThrows(AccessDeniedException.class, () -> service.authorizeCreate(authentication,
                ResourceType.CONTENT,30L,ActingRole.DOCENTE));
        verify(audit).logSystem(eq(10L),eq("ATTACHMENT_AUTHORIZATION_CREATE_REFERENCE"),eq(false),
                eq("ACCESS_DENIED"),argThat(s -> s.contains("role=DOCENTE") && s.contains("institution=1")));
    }

    @Test void auditFailureDoesNotReturnAuthorization() {
        roles(ActingRole.DOCENTE); resource(ResourceType.CONTENT,material(true,true,true,false));
        doThrow(new IllegalStateException("audit unavailable")).when(audit).logSystem(anyLong(),anyString(),anyBoolean(),any(),anyString());
        assertThrows(IllegalStateException.class, () -> invoke(ResourceType.CONTENT,
                Operation.VIEW_CONTENT_REFERENCE,ActingRole.DOCENTE,null));
    }

    @Test void parentMetadataDoesNotRequireCreationPermission() {
        roles(ActingRole.ESTUDIANTE,ActingRole.ADMIN);
        resource(ResourceType.CONTENT,material(false,true,false,true));
        assertDoesNotThrow(() -> service.authorizeResourceMetadata(authentication,ResourceType.CONTENT,30L,ActingRole.ESTUDIANTE));
        assertDoesNotThrow(() -> service.authorizeResourceMetadata(authentication,ResourceType.CONTENT,30L,ActingRole.ADMIN));
        resource(ResourceType.CONTENT,material(false,false,false,true));
        assertThrows(AccessDeniedException.class, () -> service.authorizeResourceMetadata(authentication,ResourceType.CONTENT,30L,ActingRole.ESTUDIANTE));
    }
}
