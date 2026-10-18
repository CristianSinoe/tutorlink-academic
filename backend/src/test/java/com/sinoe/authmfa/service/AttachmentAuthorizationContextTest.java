package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.institution.*;
import com.sinoe.authmfa.domain.user.*;
import com.sinoe.authmfa.security.InstitutionAccessService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.access.AccessDeniedException;
import java.time.Clock;
import java.util.List;
import java.util.Optional;
import static com.sinoe.authmfa.service.AttachmentAuthorizationService.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Exercise the existing database-backed context resolver through the new service. */
@ExtendWith(MockitoExtension.class)
class AttachmentAuthorizationContextTest {
    @Mock UserRepository users;
    @Mock InstitutionRepository institutions;
    @Mock InstitutionMembershipRepository memberships;
    @Mock AttachmentAuthorizationRepository attachments;
    @Mock AuditService audit;
    AttachmentAuthorizationService service;
    User user;
    UsernamePasswordAuthenticationToken authentication;
    @BeforeEach void setup() {
        user = User.builder().id(10L).role(UserRole.DOCENTE).status(UserStatus.ACTIVE).authorizationVersion(1L).build();
        authentication = new UsernamePasswordAuthenticationToken("u",null,List.of());
        authentication.setDetails(new InstitutionAccessService.Access(user,1L,java.util.Set.of("DOCENTE")));
        service = new AttachmentAuthorizationService(new InstitutionAccessService(users,institutions,memberships), attachments,audit,Clock.systemUTC());
    }
    void invoke() { service.authorizeCreate(authentication,ResourceType.CONTENT,30,ActingRole.DOCENTE); }
    @Test void inactiveUserDenied() {
        User inactive = User.builder().id(10L).status(UserStatus.DISABLED).authorizationVersion(1L).build();
        when(users.findById(10L)).thenReturn(Optional.of(inactive));
        assertThrows(AccessDeniedException.class,this::invoke); verifyNoInteractions(attachments,institutions,memberships);
    }
    @Test void obsoleteAuthorizationVersionDenied() {
        User changed = User.builder().id(10L).status(UserStatus.ACTIVE).authorizationVersion(2L).build();
        when(users.findById(10L)).thenReturn(Optional.of(changed));
        assertThrows(AccessDeniedException.class,this::invoke); verifyNoInteractions(attachments);
    }
    @Test void inactiveInstitutionDenied() {
        when(users.findById(10L)).thenReturn(Optional.of(user));
        when(institutions.findById(1L)).thenReturn(Optional.of(Institution.builder().id(1L).status(InstitutionStatus.INACTIVE).build()));
        assertThrows(AccessDeniedException.class,this::invoke); verifyNoInteractions(attachments,memberships);
    }
    @Test void revokedMembershipIsNotGrantedByOldContextRoles() {
        when(users.findById(10L)).thenReturn(Optional.of(user));
        when(institutions.findById(1L)).thenReturn(Optional.of(Institution.builder().id(1L).status(InstitutionStatus.ACTIVE).build()));
        when(memberships.findByUser_IdAndInstitution_IdAndStatus(10L,1L,MembershipStatus.ACTIVE)).thenReturn(List.of());
        assertThrows(AccessDeniedException.class,this::invoke); verifyNoInteractions(attachments);
    }
}
