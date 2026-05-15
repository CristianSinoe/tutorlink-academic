package com.sinoe.authmfa.dto;

import com.sinoe.authmfa.domain.user.UserRole;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

public class AdminUserDtos {

    // Crear usuario ESTUDIANTE + perfil
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateStudentUser {

        @NotBlank
        @Size(max = 120)
        private String name;

        @NotBlank
        @Size(max = 120)
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

        @NotBlank
        @Size(max = 50)
        private String matricula;

        @NotBlank
        @Size(max = 100)
        private String career;

        @NotBlank
        @Size(max = 50)
        private String plan;

        @NotNull
        @Min(1)
        @Max(12)
        private Integer semester;

        @NotNull
        private LocalDate birthDate;

        @Size(max = 20)
        private String phone;
    }

    // Crear usuario TUTOR + perfil
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateTutorUser {

        @NotBlank
        @Size(max = 120)
        private String name;

        @NotBlank
        @Size(max = 120)
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

        @NotBlank
        @Size(max = 50)
        private String tutorCode;

        @Size(max = 100)
        private String department;

        @Size(max = 150)
        private String specialty;

        @Size(max = 20)
        private String phone;
    }

    // Crear usuario ADMIN
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateAdminUser {

        @NotBlank
        @Size(max = 120)
        private String name;

        @NotBlank
        @Size(max = 120)
        private String lastNamePaterno;

        @Size(max = 120)
        private String lastNameMaterno;

        @NotBlank
        @Email
        @Size(max = 190)
        private String email;
    }

    // Cambiar estado de usuario
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChangeUserStatus {
        @NotNull
        private UserRole role;
        @NotBlank
        private String status; // CREATED_BY_ADMIN / ACTIVE / DISABLED / BLOCKED
    }

    // Importar CSV (genérico)
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CsvTextRequest {
        @NotBlank
        private String csv;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CsvImportResult {
        private int total;
        private int created;
        private int skippedExisting;
    }

    // Asignar estudiante a tutor (1 a 1)
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignStudentToTutor {
        @NotBlank
        private String tutorCode;

        @NotBlank
        private String matricula;
    }

    // Asignar estudiantes a tutores por CSV
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignTutorStudentsCsvRequest {
        @NotBlank
        private String csv;
    }

    // Asignar estudiantes a tutores por CSV (RESULTADO)
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignTutorStudentsCsvResult {
        private int total; // líneas válidas procesadas (sin header, sin vacías)
        private int assigned; // asignaciones realizadas OK
        private int errors; // líneas que fallaron (tutor / estudiante no existe, duplicado, etc.)
    }

    // Fila para listar estudiantes con perfil
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentListItem {
        private Long id;
        private String name;
        private String lastNamePaterno;
        private String lastNameMaterno;
        private String email;

        private String matricula;
        private String career;
        private String plan;
        private Integer semester;

        private String phone;
        private LocalDate birthDate;

        private String status;
    }

    // Actualizar estudiante
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateStudentUser {

        @NotBlank
        @Size(max = 120)
        private String name;

        @NotBlank
        @Size(max = 120)
        private String lastNamePaterno;

        @Size(max = 120)
        private String lastNameMaterno;

        @NotBlank
        @Email
        @Size(max = 190)
        private String email;

        @NotBlank
        @Size(max = 50)
        private String matricula;

        @NotBlank
        @Size(max = 100)
        private String career;

        @NotBlank
        @Size(max = 50)
        private String plan;

        @NotNull
        @Min(1)
        @Max(12)
        private Integer semester;

        @NotNull
        private LocalDate birthDate;

        @Size(max = 20)
        private String phone;
    }

    // Para listar tutores con info combinada User + Tutor
    @Data
    @Builder
    public static class TutorListRow {
        private Long id; // id del User
        private String name;
        private String lastNamePaterno;
        private String lastNameMaterno;
        private String email;
        private String tutorCode;
        private String department;
        private String specialty;
        private String phone;
        private String status; // ACTIVE / DISABLED / BLOCKED / CREATED_BY_ADMIN
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateTutorUser {

        @NotBlank
        private String name;

        @NotBlank
        private String lastNamePaterno;

        private String lastNameMaterno;

        @NotBlank
        @Email
        private String email;

        @NotBlank
        private String tutorCode;

        @NotBlank
        private String department;

        private String specialty;

        private String phone;
    }

    public record TutorStudentAssignmentDto(
            Long id,
            Long tutorId,
            String tutorCode,
            String tutorName,
            String tutorEmail,
            Long studentId,
            String matricula,
            String studentName,
            String studentEmail,
            java.time.LocalDateTime createdAt) {
    }
}
