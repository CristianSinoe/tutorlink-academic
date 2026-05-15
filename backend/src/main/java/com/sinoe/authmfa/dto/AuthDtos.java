package com.sinoe.authmfa.dto;

import com.sinoe.authmfa.domain.user.UserRole;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

public class AuthDtos {

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
    public static class JwtResponse {
        private String token;
        private String role;
        private String email;
        private String name;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApiMessage {
        private String message;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OtpChallengeResponse {
        private boolean requiresOtp;
        private String otpToken; // publicId del OTP
        private String message;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class VerifyOtpRequest {

        @NotBlank
        private String otpToken;  // publicId que vino del login

        @NotBlank
        private String code;      // código de 6 dígitos que escribió el usuario
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
