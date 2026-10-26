package com.sinoe.authmfa.service;
import com.sinoe.authmfa.domain.institution.*;
import com.sinoe.authmfa.domain.user.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
@ExtendWith(MockitoExtension.class)
class AuthorizationContextServiceTest {
    @Mock InstitutionMembershipRepository memberships;
    @Mock InstitutionRepository institutions;
    @Mock JwtService jwt;
    @Test void simultaneousRolesInOneInstitutionDoNotForceASecondSelection() {
        var user=User.builder().id(1L).email("personal@gmail.com").role(UserRole.DOCENTE).build();
        var school=Institution.builder().id(7L).status(InstitutionStatus.ACTIVE).build();
        when(memberships.findByUser_IdAndStatus(1L,MembershipStatus.ACTIVE)).thenReturn(List.of(
                InstitutionMembership.builder().user(user).institution(school).role(InstitutionRole.DOCENTE).build(),
                InstitutionMembership.builder().user(user).institution(school).role(InstitutionRole.TUTOR).build()));
        when(institutions.findById(7L)).thenReturn(Optional.of(school));
        when(jwt.generate(anyMap(),eq(user.getEmail()))).thenReturn("token");
        var context=new AuthorizationContextService(memberships,institutions,jwt).issue(user,null);
        assertEquals(7L,context.institutionId());assertEquals(List.of("DOCENTE","TUTOR"),context.roles());
    }
    @Test void severalInstitutionsRequireExplicitSelection() {
        var user=User.builder().id(1L).role(UserRole.ESTUDIANTE).build();
        var a=Institution.builder().id(1L).status(InstitutionStatus.ACTIVE).build();
        var b=Institution.builder().id(2L).status(InstitutionStatus.ACTIVE).build();
        when(memberships.findByUser_IdAndStatus(1L,MembershipStatus.ACTIVE)).thenReturn(List.of(
                InstitutionMembership.builder().institution(a).role(InstitutionRole.ESTUDIANTE).build(),
                InstitutionMembership.builder().institution(b).role(InstitutionRole.ESTUDIANTE).build()));
        when(institutions.findById(1L)).thenReturn(Optional.of(a));when(institutions.findById(2L)).thenReturn(Optional.of(b));
        assertThrows(IllegalStateException.class,() -> new AuthorizationContextService(memberships,institutions,jwt).issue(user,null));verifyNoInteractions(jwt);
    }

    @Test void institutionCodesAreNormalizedForPublicLinks() {
        assertEquals("BENITOJUAREZ", AuthorizationContextService.normalizeCode("  benitojuarez "));
        assertEquals("DEMO15-I1", AuthorizationContextService.normalizeCode("demo15-i1"));
    }

    @Test void institutionCodesRejectPathTraversalAndUnsafeCharacters() {
        assertThrows(IllegalArgumentException.class, () -> AuthorizationContextService.normalizeCode("/admin"));
        assertThrows(IllegalArgumentException.class, () -> AuthorizationContextService.normalizeCode("school name"));
        assertThrows(IllegalArgumentException.class, () -> AuthorizationContextService.normalizeCode("-school"));
        assertThrows(IllegalArgumentException.class, () -> AuthorizationContextService.normalizeCode("school-"));
        assertThrows(IllegalArgumentException.class, () -> AuthorizationContextService.normalizeCode("a".repeat(61)));
    }
}
