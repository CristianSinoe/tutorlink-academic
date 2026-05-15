package com.sinoe.authmfa.dto.admin;

import com.sinoe.authmfa.domain.user.UserRole;
import jakarta.validation.constraints.*;

import lombok.*;

public class AdminDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateUserRequest {
        @NotBlank
        private String name;

        @NotBlank
        private String lastNamePaterno;

        private String lastNameMaterno;

        @Email
        @NotBlank
        private String email;

        @NotNull
        private UserRole role;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateStudentProfileRequest {
        @NotBlank
        private String matricula;

        private String career;
        private String plan;
        private Integer semester;

        @NotNull
        private java.time.LocalDate birthDate;

        private String phone;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateTutorProfileRequest {
        @NotBlank
        private String tutorCode;

        private String department;
        private String specialty;
        private String phone;
    }

    @Data
    public class AdminCreateRequest {
        @NotBlank
        private String name;

        @NotBlank
        private String lastNamePaterno;

        private String lastNameMaterno;

        @Email
        @NotBlank
        private String email;
    }
}
