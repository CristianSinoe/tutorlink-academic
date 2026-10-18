package com.sinoe.authmfa.security;

import java.util.List;
import java.util.Optional;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;

/** Compatibility lookups never choose an arbitrary institution for a shared account. */
public final class ScopedProfiles {
    private ScopedProfiles() { }
    public static Long institutionId() {
        var auth=SecurityContextHolder.getContext().getAuthentication();
        if(auth==null) return null; // Internal jobs/tests must still be unambiguous.
        if(!(auth.getDetails() instanceof InstitutionAccessService.Access a) || a.institutionId()==null)
            throw new AccessDeniedException("Selecciona una institución");
        return a.institutionId();
    }
    public static boolean belongs(Long institution) { Long selected=institutionId();return selected==null || selected.equals(institution); }
    public static <T> Optional<T> unique(List<T> profiles) {
        if(profiles.size()>1) throw new AccessDeniedException("Se requiere contexto institucional para el perfil");
        return profiles.stream().findFirst();
    }
}
