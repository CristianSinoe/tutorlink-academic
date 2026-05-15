package com.sinoe.authmfa.dto.qa;

import java.time.Instant;

public record StudentQuestionDetailDto(
        Long id,
        String title,
        String body,
        String status,
        String scope,
        Instant createdAt,

        // datos del tutor
        String tutorName,
        String tutorFullName,
        String tutorEmail,

        // última respuesta
        String currentAnswerBody,
        Integer currentAnswerVersion,
        Boolean wasCorrected,

        // motivo de rechazo si aplica
        String rejectReason
) {
}
