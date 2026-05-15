package com.sinoe.authmfa.web;

import com.sinoe.authmfa.config.AdminBootstrapProperties;
import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.dto.AuthDtos;
import com.sinoe.authmfa.dto.InternalBootstrapAdminRequest;
import com.sinoe.authmfa.service.AdminProvisioningService;
import com.sinoe.authmfa.service.AllowedProfileService;
import com.sinoe.authmfa.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/internal/bootstrap")
@RequiredArgsConstructor
public class InternalBootstrapController {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String BOOTSTRAP_ADMIN_CREATE = "BOOTSTRAP_ADMIN_CREATE";

    private final AdminBootstrapProperties properties;
    private final AllowedProfileService allowedProfileService;
    private final AdminProvisioningService adminProvisioningService;
    private final AuditService auditService;

    @PostMapping("/admin")
    public ResponseEntity<AuthDtos.ApiMessage> createAdmin(
            @Valid @RequestBody InternalBootstrapAdminRequest request,
            @RequestHeader(name = "Authorization", required = false) String authorization,
            HttpServletRequest httpRequest) {

        if (!properties.isEnabled() || !allowedProfileService.isLocalDevOrDemo()) {
            auditService.log(httpRequest, null, BOOTSTRAP_ADMIN_CREATE, false,
                    "BOOTSTRAP_DISABLED", "Endpoint interno de bootstrap deshabilitado para este entorno.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new AuthDtos.ApiMessage("Endpoint no disponible."));
        }

        if (!isAuthorized(authorization)) {
            auditService.log(httpRequest, null, BOOTSTRAP_ADMIN_CREATE, false,
                    "INVALID_BOOTSTRAP_TOKEN", "Token de bootstrap inválido.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthDtos.ApiMessage("Token de bootstrap inválido."));
        }

        try {
            User user = adminProvisioningService.createActiveAdmin(
                    request.name(),
                    request.email(),
                    request.password());

            auditService.log(httpRequest, user.getId(), BOOTSTRAP_ADMIN_CREATE, true,
                    null, "Administrador creado mediante endpoint interno protegido.");

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new AuthDtos.ApiMessage("Administrador creado correctamente."));
        } catch (IllegalStateException ex) {
            auditService.log(httpRequest, null, BOOTSTRAP_ADMIN_CREATE, false,
                    "EMAIL_DUP", ex.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new AuthDtos.ApiMessage(ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            auditService.log(httpRequest, null, BOOTSTRAP_ADMIN_CREATE, false,
                    "VALIDATION_ERROR", ex.getMessage());
            return ResponseEntity.badRequest()
                    .body(new AuthDtos.ApiMessage(ex.getMessage()));
        }
    }

    private boolean isAuthorized(String authorization) {
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            return false;
        }
        String token = authorization.substring(BEARER_PREFIX.length()).trim();
        String expected = properties.getToken();
        return expected != null && !expected.isBlank() && expected.equals(token);
    }
}
