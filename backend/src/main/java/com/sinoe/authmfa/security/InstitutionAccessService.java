package com.sinoe.authmfa.security;

import com.sinoe.authmfa.domain.institution.*;
import com.sinoe.authmfa.domain.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import java.util.*;

/** Database-backed request authorization. JWT claims identify a context but never grant it by themselves. */
@Service
@RequiredArgsConstructor
public class InstitutionAccessService {
    private final UserRepository users;
    private final InstitutionRepository institutions;
    private final InstitutionMembershipRepository memberships;

    public Access resolve(Long userId, Long institutionId, Long tokenVersion) {
        User user = users.findById(userId).orElseThrow(() -> new AccessDeniedException("Usuario no vigente"));
        if (user.getStatus() != UserStatus.ACTIVE || !Objects.equals(user.getAuthorizationVersion(), tokenVersion)) {
            throw new AccessDeniedException("El contexto de autorización ya no es válido");
        }
        if (institutionId == null) {
            if (user.getRole() != UserRole.SUPER_ADMIN) throw new AccessDeniedException("Se requiere institución activa");
            return new Access(user, null, Set.of("PLATFORM_SUPER_ADMIN"));
        }
        Institution institution = institutions.findById(institutionId)
                .filter(value -> value.getStatus() == InstitutionStatus.ACTIVE)
                .orElseThrow(() -> new AccessDeniedException("Institución no disponible"));
        Set<String> roles = new HashSet<>();
        if (user.getRole() == UserRole.SUPER_ADMIN) roles.add("SUPER_ADMIN");
        for (InstitutionMembership membership : memberships.findByUser_IdAndInstitution_IdAndStatus(userId, institution.getId(), MembershipStatus.ACTIVE)) {
            roles.add(membership.getRole().name());
        }
        if (roles.isEmpty()) throw new AccessDeniedException("No perteneces a la institución seleccionada");
        return new Access(user, institutionId, Set.copyOf(roles));
    }

    public List<InstitutionMembership> activeMemberships(Long userId) {
        return memberships.findByUser_IdAndStatus(userId, MembershipStatus.ACTIVE);
    }

    public record Access(User user, Long institutionId, Set<String> roles) { }
}
