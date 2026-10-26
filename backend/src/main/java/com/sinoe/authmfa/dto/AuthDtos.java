package com.sinoe.authmfa.dto;

import com.sinoe.authmfa.domain.user.UserRole;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

public class AuthDtos {

    private AuthDtos() {
    }

    // REGISTER

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegisterRequest {
        @NotBlank
        @Size(min = 2, max = 120)
        private String name;

        @NotBlank
        @Size(min = 2, max = 120)
        private String lastNamePaterno;

        @Size(max = 120)
        private String lastNameMaterno;

        @NotBlank
        @Email
        @Size(max = 190)
        private String email;

        @NotBlank
        @Size(min = 8, max = 100)
        private String password;

        @NotNull
        private UserRole role;

        @NotNull
        private LocalDate birthDate;

        @NotBlank
        private String recaptchaToken;
    }

    // LOGIN

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginRequest {
        @NotBlank
        @Email
        private String email;

        @NotBlank
        private String password;

        @NotBlank
        private String recaptchaToken;

        @Size(max = 60)
        private String institutionCode;
    }

    // ACTIVATE ACCOUNT

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActivateAccountRequest {
        @NotBlank
        private String token;

        @NotBlank
        @Size(min = 8, max = 100)
        private String password;
    }

    // RESPUESTAS

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JwtResponse implements ApiPayload {
        private String token;
        private String role;
        private Long institutionId;
        private java.util.List<String> roles;
        private String email;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContextRequest { @NotNull private Long institutionId; }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApiMessage implements ApiPayload {
        private String message;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OtpChallengeResponse implements ApiPayload {
        private boolean requiresOtp;
        private String otpToken; // publicId del OTP
        private String message;
        private long resendCooldownSeconds;
        private java.util.List<InstitutionOption> institutions;
        public OtpChallengeResponse(boolean requiresOtp,String otpToken,String message,long resendCooldownSeconds) {
            this(requiresOtp,otpToken,message,resendCooldownSeconds,java.util.List.of());
        }
    }
    public record InstitutionOption(Long institutionId,String name,java.util.List<String> roles,String code) {
        public InstitutionOption(Long institutionId,String name,java.util.List<String> roles) {
            this(institutionId,name,roles,null);
        }
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class VerifyOtpRequest {

        @NotBlank
        private String otpToken;  // publicId que vino del login

        @NotBlank
        private String code;      // código de 6 dígitos que escribió el usuario

        @Positive private Long institutionId;

        @Size(max = 60)
        private String institutionCode;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ResendOtpRequest {

        @NotBlank
        private String otpToken;
    }

    // NUEVO: Inicio del cambio de contraseña (vacío)

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PasswordChangeRequest {

        @NotBlank
        private String currentPassword;

        @NotBlank
        private String newPassword;

        @NotBlank
        private String confirmNewPassword;

        @NotBlank
        private String code; // OTP enviado al correo
    }
}
