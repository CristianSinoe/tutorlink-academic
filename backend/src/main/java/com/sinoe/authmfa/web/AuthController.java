package com.sinoe.authmfa.web;

import com.sinoe.authmfa.domain.otp.OtpCode;
import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.domain.user.UserStatus;
import com.sinoe.authmfa.dto.AuthDtos;
import com.sinoe.authmfa.dto.FirstLoginRequest;
import com.sinoe.authmfa.service.AuditService;
import com.sinoe.authmfa.service.EmailService;
import com.sinoe.authmfa.service.JwtService;
import com.sinoe.authmfa.service.OtpService;
import com.sinoe.authmfa.service.RecaptchaService;
import com.sinoe.authmfa.validation.AgeValidator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository users;
    private final JwtService jwt;
    private final RecaptchaService recaptcha;
    private final AuditService audit;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final EmailService emailService;

    // DTO local para activación
    record ActivateRequest(String token) {
    }

    // 1) Registro normal (front público)

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthDtos.RegisterRequest reqDto,
            HttpServletRequest http) {
        Long uid = null;
        try {
            boolean human = recaptcha.verify(reqDto.getRecaptchaToken(), http.getRemoteAddr());
            if (!human) {
                audit.log(http, null, "REGISTER", false, "RECAPTCHA_FAIL", "reCAPTCHA inválido");
                return ResponseEntity.badRequest().body(new AuthDtos.ApiMessage("reCAPTCHA inválido"));
            }

            if (!AgeValidator.between15and120(reqDto.getBirthDate())) {
                audit.log(http, null, "REGISTER", false, "AGE_OUT_OF_RANGE", "Edad fuera de rango");
                return ResponseEntity.badRequest()
                        .body(new AuthDtos.ApiMessage("La edad debe estar entre 15 y 120 años"));
            }

            final String email = lower(reqDto.getEmail());
            if (users.existsByEmail(email)) {
                audit.log(http, null, "REGISTER", false, "EMAIL_DUP", "Correo ya registrado");
                return ResponseEntity.badRequest().body(new AuthDtos.ApiMessage("Correo ya registrado"));
            }

            // Hash de la contraseña usando PasswordEncoder (configurado en Security)
            String hash = passwordEncoder.encode(reqDto.getPassword());

            // Registro "auto-service": usuario queda ACTIVO de inmediato
            User u = User.builder()
                    .name(trimOrNull(reqDto.getName()))
                    .lastNamePaterno(trimOrNull(reqDto.getLastNamePaterno()))
                    .lastNameMaterno(trimToNullIfEmpty(reqDto.getLastNameMaterno()))
                    .email(email)
                    .passwordHash(hash)
                    .role(reqDto.getRole())
                    .status(UserStatus.ACTIVE)
                    .build();

            u = users.save(u);
            uid = u.getId();

            String token = jwt.generate(
                    Map.of("role", u.getRole().name(), "uid", u.getId()),
                    u.getEmail());

            audit.log(http, uid, "REGISTER", true, null, "Usuario registrado");
            return ResponseEntity.ok(AuthDtos.JwtResponse.builder()
                    .token(token)
                    .role(u.getRole().name())
                    .email(u.getEmail())
                    .name(u.getName())
                    .build());

        } catch (Exception ex) {
            audit.log(http, uid, "REGISTER", false, "EXCEPTION", ex.getMessage());
            throw ex;
        }
    }

    // 2) Activación de cuenta creada por ADMIN (flujo viejo por token de
    // activación)

    @PostMapping("/activate")
    public ResponseEntity<?> activate(@RequestBody ActivateRequest req, HttpServletRequest http) {
        String rawToken = req.token();
        if (rawToken == null || rawToken.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new AuthDtos.ApiMessage("Token de activación requerido"));
        }

        var opt = users.findByActivationToken(rawToken.trim());
        if (opt.isEmpty()) {
            audit.log(http, null, "ACTIVATE", false, "TOKEN_NOT_FOUND", "Token inválido");
            return ResponseEntity.badRequest()
                    .body(new AuthDtos.ApiMessage("Token de activación inválido"));
        }

        User u = opt.get();

        // Solo se activa si está en CREATED_BY_ADMIN
        if (u.getStatus() != UserStatus.CREATED_BY_ADMIN) {
            audit.log(http, u.getId(), "ACTIVATE", false, "BAD_STATUS",
                    "Estado actual: " + u.getStatus());
            return ResponseEntity.badRequest()
                    .body(new AuthDtos.ApiMessage("La cuenta no está pendiente de activación"));
        }

        // Verificar expiración
        if (u.getActivationExpiresAt() != null &&
                u.getActivationExpiresAt().isBefore(OffsetDateTime.now())) {
            audit.log(http, u.getId(), "ACTIVATE", false, "TOKEN_EXPIRED", "Token expirado");
            return ResponseEntity.badRequest()
                    .body(new AuthDtos.ApiMessage("El enlace de activación ha expirado"));
        }

        // Activar
        u.setStatus(UserStatus.ACTIVE);
        u.setActivationToken(null);
        u.setActivationExpiresAt(null);
        users.save(u);

        audit.log(http, u.getId(), "ACTIVATE", true, null, "Cuenta activada");
        return ResponseEntity.ok(new AuthDtos.ApiMessage("Cuenta activada correctamente"));
    }

    // 2.1) Completar primer login (link enviado por correo)

    @PostMapping("/first-login/complete")
    public ResponseEntity<?> completeFirstLogin(@Valid @RequestBody FirstLoginRequest req,
            HttpServletRequest http) {
        Long uid = null;
        try {
            String rawToken = req.token();
            if (rawToken == null || rawToken.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(new AuthDtos.ApiMessage("Token de primer inicio requerido"));
            }

            var opt = users.findByFirstLoginToken(rawToken.trim());
            if (opt.isEmpty()) {
                audit.log(http, null, "FIRST_LOGIN_COMPLETE", false,
                        "TOKEN_NOT_FOUND", "Token inválido o ya utilizado");
                return ResponseEntity.badRequest()
                        .body(new AuthDtos.ApiMessage("El enlace no es válido o ya fue utilizado"));
            }

            User u = opt.get();
            uid = u.getId();

            // Verificar expiración del token de primer login
            if (u.getFirstLoginExpiresAt() != null &&
                    u.getFirstLoginExpiresAt().isBefore(Instant.now())) {
                audit.log(http, uid, "FIRST_LOGIN_COMPLETE", false,
                        "TOKEN_EXPIRED", "Token de primer login expirado");
                return ResponseEntity.badRequest()
                        .body(new AuthDtos.ApiMessage("El enlace ha expirado. Solicita uno nuevo al administrador."));
            }

            // Definir la contraseña por primera vez
            u.setPasswordHash(passwordEncoder.encode(req.password()));
            u.setFirstLoginToken(null);
            u.setFirstLoginExpiresAt(null);

            // Si fue creado por admin, lo pasamos a ACTIVO
            if (u.getStatus() == UserStatus.CREATED_BY_ADMIN) {
                u.setStatus(UserStatus.ACTIVE);
            }

            users.save(u);

            audit.log(http, uid, "FIRST_LOGIN_COMPLETE", true,
                    null, "Primer login completado, contraseña definida");

            return ResponseEntity.ok(
                    new AuthDtos.ApiMessage("Contraseña definida correctamente. Ya puedes iniciar sesión."));

        } catch (Exception ex) {
            audit.log(http, uid, "FIRST_LOGIN_COMPLETE", false, "EXCEPTION", ex.getMessage());
            throw ex;
        }
    }

    // 3) Login

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthDtos.LoginRequest reqDto,
            HttpServletRequest http) {
        Long uid = null;
        try {
            // 1) Validar reCAPTCHA
            boolean human = recaptcha.verify(reqDto.getRecaptchaToken(), http.getRemoteAddr());
            if (!human) {
                audit.log(http, null, "LOGIN", false, "RECAPTCHA_FAIL", "reCAPTCHA inválido");
                return ResponseEntity
                        .badRequest()
                        .body(new AuthDtos.ApiMessage("reCAPTCHA inválido"));
            }

            // 2) Buscar usuario por email
            final String email = lower(reqDto.getEmail());
            var opt = users.findByEmail(email);
            if (opt.isEmpty() ||
                    !passwordEncoder.matches(reqDto.getPassword(), opt.get().getPasswordHash())) {
                audit.log(http, null, "LOGIN", false, "CREDENTIALS", "Credenciales inválidas");
                return ResponseEntity
                        .status(401)
                        .body(new AuthDtos.ApiMessage("Credenciales inválidas"));
            }

            var u = opt.get();
            uid = u.getId();

            // 3) Validar STATUS (solo ACTIVE puede loguearse normal)
            if (u.getStatus() != UserStatus.ACTIVE) {
                String code;
                String msg;

                switch (u.getStatus()) {
                    case CREATED_BY_ADMIN -> {
                        code = "ACCOUNT_NOT_ACTIVE";
                        msg = "Cuenta no activada. Revisa tu correo o contacta al administrador.";
                    }
                    case DISABLED -> {
                        code = "ACCOUNT_DISABLED";
                        msg = "Cuenta deshabilitada. Contacta al administrador.";
                    }
                    case BLOCKED -> {
                        code = "ACCOUNT_BLOCKED";
                        msg = "Cuenta bloqueada. Contacta al administrador.";
                    }
                    default -> {
                        code = "ACCOUNT_INVALID_STATUS";
                        msg = "Estado de cuenta inválido.";
                    }
                }

                audit.log(http, uid, "LOGIN", false, code, msg);
                return ResponseEntity
                        .status(403)
                        .body(new AuthDtos.ApiMessage(msg));
            }

            // 4) Si pasó credenciales y status, generamos OTP para LOGIN
            var otp = otpService.generateLoginOtpForUser(u.getId());

            // 5) Enviar OTP por correo (template profesional)
            emailService.sendLoginOtpEmail(u.getEmail(), otp.getCode());

            // 6) Registrar en auditoría que el login pasó a fase OTP
            audit.log(http, uid, "LOGIN_OTP_REQUEST", true, null,
                    "Credenciales válidas, OTP enviado al correo");

            // 7) Responder al frontend que ahora debe pedir OTP
            return ResponseEntity.ok(
                    new AuthDtos.OtpChallengeResponse(
                            true,
                            otp.getPublicId(), // ID público/UUID que identifica este OTP
                            "Se envió un código de verificación a tu correo institucional."));

        } catch (Exception ex) {
            audit.log(http, uid, "LOGIN", false, "EXCEPTION", ex.getMessage());
            throw ex;
        }
    }

    @PostMapping("/login/verify-otp")
    public ResponseEntity<?> verifyLoginOtp(
            @Valid @RequestBody AuthDtos.VerifyOtpRequest req,
            HttpServletRequest http) {

        Long uid = null;
        try {
            // 1) Validar OTP
            OtpCode otp = otpService.validateForLogin(req.getOtpToken(), req.getCode());
            if (otp == null) {
                audit.log(http, null, "LOGIN_OTP", false, "OTP_INVALID", "OTP inválido o expirado");
                return ResponseEntity
                        .status(401)
                        .body(new AuthDtos.ApiMessage("Código inválido o expirado"));
            }

            // 2) Buscar usuario
            User u = users.findById(otp.getUserId()).orElse(null);
            if (u == null) {
                audit.log(http, null, "LOGIN_OTP", false, "USER_NOT_FOUND", "Usuario no encontrado para OTP");
                return ResponseEntity
                        .status(404)
                        .body(new AuthDtos.ApiMessage("Usuario no encontrado"));
            }

            uid = u.getId();

            // 3) Verificar que siga ACTIVO
            if (u.getStatus() != UserStatus.ACTIVE) {
                String msg;
                switch (u.getStatus()) {
                    case CREATED_BY_ADMIN -> msg = "Cuenta no activada. Revisa tu correo o contacta al administrador.";
                    case DISABLED -> msg = "Cuenta deshabilitada. Contacta al administrador.";
                    case BLOCKED -> msg = "Cuenta bloqueada. Contacta al administrador.";
                    default -> msg = "Estado de cuenta inválido.";
                }

                audit.log(http, uid, "LOGIN_OTP", false, "ACCOUNT_STATUS", msg);
                return ResponseEntity.status(403).body(new AuthDtos.ApiMessage(msg));
            }

            // 4) Si todo OK → generar JWT
            String token = jwt.generate(
                    Map.of("role", u.getRole().name(), "uid", u.getId()),
                    u.getEmail());

            audit.log(http, uid, "LOGIN_OTP", true, null, "OTP ok, login completado");

            return ResponseEntity.ok(
                    AuthDtos.JwtResponse.builder()
                            .token(token)
                            .role(u.getRole().name())
                            .email(u.getEmail())
                            .name(u.getName())
                            .build());

        } catch (Exception ex) {
            audit.log(http, uid, "LOGIN_OTP", false, "EXCEPTION", ex.getMessage());
            throw ex;
        }
    }

    // 4) Solicitar cambio de contraseña (envía OTP)

    @PostMapping("/password/change/request")
    public ResponseEntity<?> requestPasswordChange(
            Authentication auth,
            HttpServletRequest http) {

        String email = auth.getName();
        var optUser = users.findByEmail(lower(email));

        if (optUser.isEmpty()) {
            audit.log(http, null, "PASS_CHANGE_OTP", false, "USER_NOT_FOUND",
                    "Usuario no encontrado en request de cambio de contraseña");
            return ResponseEntity
                    .status(404)
                    .body(new AuthDtos.ApiMessage("Usuario no encontrado"));
        }

        User u = optUser.get();
        Long uid = u.getId();

        // Generar OTP con propósito PASSWORD_CHANGE
        String code = otpService.generatePasswordChangeOtpForUser(uid);

        // Enviar correo con el código
        emailService.sendPasswordChangeOtpEmail(u.getEmail(), code);

        // Auditoría
        audit.log(http, uid, "PASS_CHANGE_OTP", true, null,
                "OTP de cambio de contraseña enviado");

        return ResponseEntity.ok(
                new AuthDtos.ApiMessage("Se envió un código a tu correo institucional."));
    }

    // 5) Confirmar cambio de contraseña (valida OTP)

    @PostMapping("/password/change/confirm")
    public ResponseEntity<?> confirmPasswordChange(
            Authentication auth,
            HttpServletRequest http,
            @Valid @RequestBody AuthDtos.PasswordChangeRequest dto) {

        String email = auth.getName();
        var optUser = users.findByEmail(lower(email));

        if (optUser.isEmpty()) {
            audit.log(http, null, "PASS_CHANGE_CONFIRM", false, "USER_NOT_FOUND",
                    "Usuario no encontrado en confirm de cambio de contraseña");
            return ResponseEntity
                    .status(404)
                    .body(new AuthDtos.ApiMessage("Usuario no encontrado"));
        }

        User u = optUser.get();
        Long uid = u.getId();

        // 1) Validar que la nueva contraseña y confirmación coincidan
        if (!dto.getNewPassword().equals(dto.getConfirmNewPassword())) {
            audit.log(http, uid, "PASS_CHANGE_CONFIRM", false, "PASS_MISMATCH",
                    "La confirmación de la nueva contraseña no coincide");
            return ResponseEntity
                    .badRequest()
                    .body(new AuthDtos.ApiMessage("La confirmación de la nueva contraseña no coincide."));
        }

        // 2) Validar contraseña actual
        if (!passwordEncoder.matches(dto.getCurrentPassword(), u.getPasswordHash())) {
            audit.log(http, uid, "PASS_CHANGE_CONFIRM", false, "BAD_CURRENT_PASS",
                    "Contraseña actual incorrecta");
            return ResponseEntity
                    .status(401)
                    .body(new AuthDtos.ApiMessage("La contraseña actual es incorrecta."));
        }

        // 3) Reglas básicas de complejidad
        if (dto.getNewPassword().length() < 8) {
            return ResponseEntity
                    .badRequest()
                    .body(new AuthDtos.ApiMessage("La nueva contraseña debe tener al menos 8 caracteres."));
        }

        // 4) Validar OTP con propósito PASSWORD_CHANGE
        boolean otpOk = otpService.validatePasswordChangeOtp(uid, dto.getCode());
        if (!otpOk) {
            audit.log(http, uid, "PASS_CHANGE_CONFIRM", false, "OTP_INVALID",
                    "OTP inválido o expirado en cambio de contraseña");
            return ResponseEntity
                    .status(401)
                    .body(new AuthDtos.ApiMessage("Código inválido o expirado."));
        }

        // 5) Actualizar contraseña
        u.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
        users.save(u);

        audit.log(http, uid, "PASS_CHANGE_CONFIRM", true, null,
                "Contraseña cambiada correctamente");

        return ResponseEntity.ok(
                new AuthDtos.ApiMessage("Contraseña actualizada correctamente."));
    }

    // helpers
    private static String lower(String s) {
        return s == null ? null : s.toLowerCase();
    }

    private static String trimOrNull(String s) {
        if (s == null)
            return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String trimToNullIfEmpty(String s) {
        return trimOrNull(s);
    }
}
