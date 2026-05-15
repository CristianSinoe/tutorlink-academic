package com.sinoe.authmfa.dto;

import com.sinoe.authmfa.domain.qa.Scope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

public class QaDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NewQuestion {
        @NotNull
        private Scope scope;
        @NotBlank
        @Size(min = 4, max = 200)
        private String title;
        @NotBlank
        @Size(min = 10, max = 4000)
        private String body;
        @NotBlank
        private String recaptchaToken;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AnswerRequest {
        @NotBlank
        @Size(min = 5, max = 8000)
        private String body;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RejectRequest {
        @NotBlank
        @Size(min = 5, max = 1000)
        private String reason;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReclassifyRequest {
        @NotNull
        private Scope scope;
    }

    // RESUMEN DE PREGUNTA (para listado del estudiante)

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionSummary {
        private Long id;
        private String title;
        private String status;   // Enum Status en String
        private String scope;    // Enum Scope en String
        private String createdAt;
    }

    // DETALLE DE PREGUNTA (vista estudiante)

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentQuestionDetail {
        private Long id;
        private String title;
        private String body;
        private String status;
        private String scope;
        private String createdAt;

        // Datos del tutor (si ya respondió)
        private String tutorName;
        private String tutorFullName;
        private String tutorEmail;

        // Respuesta actual
        private String currentAnswerBody;
        private Integer currentAnswerVersion;
        private Boolean wasCorrected;

        // Motivo de rechazo
        private String rejectReason;
    }

}
