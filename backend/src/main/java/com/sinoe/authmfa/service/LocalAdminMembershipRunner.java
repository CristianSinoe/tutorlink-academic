package com.sinoe.authmfa.service;

import com.sinoe.authmfa.config.AppSeedAdminProperties;
import com.sinoe.authmfa.domain.institution.InstitutionMembership;
import com.sinoe.authmfa.domain.institution.InstitutionMembershipRepository;
import com.sinoe.authmfa.domain.institution.InstitutionRepository;
import com.sinoe.authmfa.domain.institution.InstitutionRole;
import com.sinoe.authmfa.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Adds the opt-in local seed account to a demo institution; never active in prod. */
@Component
@Profile("local")
@Order(Ordered.LOWEST_PRECEDENCE)
@RequiredArgsConstructor
public class LocalAdminMembershipRunner implements ApplicationRunner {
    private final AppSeedAdminProperties seed;
    private final UserRepository users;
    private final InstitutionRepository institutions;
    private final InstitutionMembershipRepository memberships;

    @Value("${app.seed-admin.institution-code:DEMO15-I1}")
    private String institutionCode;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!seed.isEnabled()) return;
        var user = users.findByEmail(seed.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new IllegalStateException("No se encontró la cuenta seed local"));
        var institution = institutions.findByCode(institutionCode)
                .orElseThrow(() -> new IllegalStateException("No se encontró la institución demo local"));
        memberships.findByInstitution_IdAndUser_IdAndRole(institution.getId(), user.getId(), InstitutionRole.ADMIN)
                .orElseGet(() -> memberships.save(InstitutionMembership.builder()
                        .institution(institution).user(user).role(InstitutionRole.ADMIN).build()));
    }
}
