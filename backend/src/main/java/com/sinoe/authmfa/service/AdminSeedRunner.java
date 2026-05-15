package com.sinoe.authmfa.service;

import com.sinoe.authmfa.config.AppSeedAdminProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeedRunner implements ApplicationRunner {

    private static final String SEED_ADMIN_CREATE = "SEED_ADMIN_CREATE";

    private final AppSeedAdminProperties properties;
    private final AllowedProfileService allowedProfileService;
    private final AdminProvisioningService adminProvisioningService;
    private final AuditService auditService;

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isEnabled()) {
            return;
        }

        if (!allowedProfileService.isLocalDevOrDemo()) {
            log.info("Seed de administrador omitido: perfil activo no permitido.");
            return;
        }

        try {
            var result = adminProvisioningService.seedActiveAdminIfMissing(
                    properties.getName(),
                    properties.getEmail(),
                    properties.getPassword());

            if (result.created()) {
                auditService.logSystem(
                        result.user().getId(),
                        SEED_ADMIN_CREATE,
                        true,
                        null,
                        "Administrador inicial creado para entorno local/demo.");
                log.info("Administrador inicial creado para el correo {}", result.user().getEmail());
            } else {
                auditService.logSystem(
                        result.user().getId(),
                        SEED_ADMIN_CREATE,
                        true,
                        "ALREADY_EXISTS",
                        "Administrador inicial ya existente; no se duplicó el usuario.");
                log.info("Seed de administrador omitido porque el correo {} ya existe.", result.user().getEmail());
            }
        } catch (Exception ex) {
            auditService.logSystem(
                    null,
                    SEED_ADMIN_CREATE,
                    false,
                    "SEED_FAILED",
                    ex.getMessage());
            log.error("No se pudo crear el administrador inicial: {}", ex.getMessage());
            throw ex;
        }
    }
}
