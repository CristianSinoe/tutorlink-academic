package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.otp.OtpCode;
import com.sinoe.authmfa.domain.otp.OtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;
    private final SecureRandom random = new SecureRandom();

    @Value("${otp.exp-minutes}")
    private long expMinutes;

    @Value("${otp.max-attempts}")
    private int maxAttempts;

    @Value("${otp.resend-cooldown-seconds}")
    private long resendCooldown;

    // UTILIDADES INTERNAS

    // Genera un código de 6 dígitos con padding de ceros.

    private String generateCode() {
        return String.format("%06d", random.nextInt(1_000_000));
    }

    // Método genérico para generar y guardar un OTP para un usuario y propósito dado.Devuelve solamente el código, para flujos donde no se necesita el publicId

    public String generateAndSave(Long userId, String purpose) {
        String code = generateCode();
        String publicId = UUID.randomUUID().toString();
        Instant now = Instant.now();

        OtpCode otp = OtpCode.builder()
                .userId(userId)
                .code(code)
                .publicId(publicId)
                .purpose(purpose)
                .attempts(0)
                .createdAt(now)
                .lastSentAt(now)
                .expiresAt(now.plusSeconds(expMinutes * 60))
                .consumed(false)
                .build();

        otpRepository.save(otp);
        return code;
    }

    // Método genérico para validar un OTP por usuario + propósito. Se toma el último OTP creado para ese usuario y propósito

    public boolean validateAndConsume(Long userId, String purpose, String code) {
        Optional<OtpCode> opt = otpRepository
                .findTopByUserIdAndPurposeOrderByCreatedAtDesc(userId, purpose);

        if (opt.isEmpty()) {
            return false;
        }

        OtpCode otp = opt.get();

        // vencido
        if (otp.getExpiresAt() != null && Instant.now().isAfter(otp.getExpiresAt())) {
            return false;
        }

        // ya usado
        if (otp.isConsumed()) {
            return false;
        }

        // demasiados intentos
        if (otp.getAttempts() >= maxAttempts) {
            return false;
        }

        // incrementar intentos
        otp.setAttempts(otp.getAttempts() + 1);

        boolean ok = otp.getCode().equals(code);
        if (ok) {
            otp.setConsumed(true);
        }

        otpRepository.save(otp);
        return ok;
    }

    // GENERAR OTP PARA LOGIN (como ya lo tenías)

    public OtpCode generateLoginOtpForUser(Long userId) {
        String code = generateCode();
        String publicId = UUID.randomUUID().toString();
        Instant now = Instant.now();

        OtpCode otp = OtpCode.builder()
                .userId(userId)
                .code(code)
                .publicId(publicId)
                .purpose("LOGIN")
                .attempts(0)
                .createdAt(now)
                .lastSentAt(now)
                .expiresAt(now.plusSeconds(expMinutes * 60))
                .consumed(false)
                .build();

        return otpRepository.save(otp);
    }

    public boolean canResend(Long userId, String purpose) {
        Optional<OtpCode> last = otpRepository
                .findTopByUserIdAndPurposeOrderByCreatedAtDesc(userId, purpose);

        if (last.isEmpty()) return true;

        OtpCode otp = last.get();
        if (otp.getLastSentAt() == null) return true;

        return Instant.now().isAfter(
                otp.getLastSentAt().plusSeconds(resendCooldown)
        );
    }

    // VALIDAR OTP POR publicId (LOGIN)

    public OtpCode validateForLogin(String publicId, String code) {
        Optional<OtpCode> opt = otpRepository.findByPublicIdAndPurpose(publicId, "LOGIN");
        if (opt.isEmpty()) {
            return null;
        }

        OtpCode otp = opt.get();

        // vencido
        if (otp.getExpiresAt() != null && Instant.now().isAfter(otp.getExpiresAt())) {
            return null;
        }

        // ya usado
        if (otp.isConsumed()) {
            return null;
        }

        // demasiados intentos
        if (otp.getAttempts() >= maxAttempts) {
            return null;
        }

        // incrementar intentos
        otp.setAttempts(otp.getAttempts() + 1);

        boolean ok = otp.getCode().equals(code);
        if (ok) {
            otp.setConsumed(true);
        }

        otpRepository.save(otp);

        return ok ? otp : null;
    }

    // HELPERS ESPECÍFICOS PARA PASSWORD_CHANGE

    //Genera un OTP para el propósito PASSWORD_CHANGE y devuelve solamente el código. Ideal para usar en el flujo de cambio de contraseña del usuario autenticado

    public String generatePasswordChangeOtpForUser(Long userId) {
        return generateAndSave(userId, "PASSWORD_CHANGE");
    }

    // Valida un OTP para el propósito PASSWORD_CHANGE, usando el último OTP, asociado a ese usuario y propósito
    
    public boolean validatePasswordChangeOtp(Long userId, String code) {
        return validateAndConsume(userId, "PASSWORD_CHANGE", code);
    }
}
