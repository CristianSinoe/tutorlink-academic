package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.institution.*;
import com.sinoe.authmfa.domain.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AuthorizationContextService {
    private final InstitutionMembershipRepository memberships;
    private final InstitutionRepository institutions;
    private final JwtService jwt;

    @org.springframework.transaction.annotation.Transactional(readOnly=true)
    public IssuedContext issue(User user, Long institutionId) {
        Long selected = institutionId;
        List<InstitutionMembership> active = memberships.findByUser_IdAndStatus(user.getId(), MembershipStatus.ACTIVE);
        if (selected == null && user.getRole() != UserRole.SUPER_ADMIN) {
            var available=active.stream().map(m -> m.getInstitution().getId()).distinct()
                    .filter(id -> institutions.findById(id).filter(i -> i.getStatus()==InstitutionStatus.ACTIVE).isPresent()).toList();
            if(available.size()!=1) throw new IllegalStateException("Selecciona una institución para continuar");
            selected=available.get(0);
        }
        Set<String> roles = new TreeSet<>();
        if (selected == null) {
            if (user.getRole() != UserRole.SUPER_ADMIN) throw new AccessDeniedException("Institución requerida");
            roles.add("PLATFORM_SUPER_ADMIN");
        } else {
            Institution institution = institutions.findById(selected)
                    .filter(value -> value.getStatus() == InstitutionStatus.ACTIVE)
                    .orElseThrow(() -> new IllegalArgumentException("Institución no disponible"));
            if (user.getRole() == UserRole.SUPER_ADMIN) roles.add("SUPER_ADMIN");
            for (InstitutionMembership membership : active) {
                if (membership.getInstitution().getId().equals(institution.getId())) roles.add(membership.getRole().name());
            }
            if (roles.isEmpty()) throw new AccessDeniedException("No perteneces a la institución seleccionada");
        }
        Map<String, Object> claims = new HashMap<>();
        claims.put("uid", user.getId());
        claims.put("authVersion", user.getAuthorizationVersion());
        claims.put("roles", roles);
        if (selected != null) claims.put("institutionId", selected);
        return new IssuedContext(jwt.generate(claims, user.getEmail()), selected, List.copyOf(roles));
    }

    @org.springframework.transaction.annotation.Transactional(readOnly=true)
    public List<com.sinoe.authmfa.dto.AuthDtos.InstitutionOption> available(User user) {
        Map<Long,Set<String>> grouped=new TreeMap<>();
        for(var membership:memberships.findByUser_IdAndStatus(user.getId(),MembershipStatus.ACTIVE)) {
            grouped.computeIfAbsent(membership.getInstitution().getId(),id -> new TreeSet<>()).add(membership.getRole().name());
        }
        List<com.sinoe.authmfa.dto.AuthDtos.InstitutionOption> result=new ArrayList<>();
        grouped.forEach((id,roles) -> institutions.findById(id).filter(i -> i.getStatus()==InstitutionStatus.ACTIVE)
                .ifPresent(i -> result.add(new com.sinoe.authmfa.dto.AuthDtos.InstitutionOption(id,i.getName(),List.copyOf(roles),i.getCode()))));
        return result;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly=true)
    public Institution resolveActiveCode(String rawCode) {
        String code = normalizeCode(rawCode);
        return institutions.findByCode(code)
                .filter(i -> i.getStatus() == InstitutionStatus.ACTIVE)
                .orElseThrow(() -> new AccessDeniedException("Institución no disponible"));
    }

    @org.springframework.transaction.annotation.Transactional(readOnly=true)
    public boolean hasActiveMembership(User user, Long institutionId) {
        return !memberships.findByUser_IdAndInstitution_IdAndStatus(user.getId(), institutionId, MembershipStatus.ACTIVE).isEmpty();
    }

    public static String normalizeCode(String rawCode) {
        if (rawCode == null || !rawCode.trim().matches("[A-Za-z0-9](?:[A-Za-z0-9-]{0,58}[A-Za-z0-9])?"))
            throw new IllegalArgumentException("Código institucional inválido");
        return rawCode.trim().toUpperCase(Locale.ROOT);
    }
    public record IssuedContext(String token, Long institutionId, List<String> roles) { }
}
