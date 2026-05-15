package com.sinoe.authmfa.dto.qa;

import java.time.Instant;

// Detalle para revisión
public record QuestionDetailDto(
        Long id,
        String title,
        String body,
        String status,
        String scope,
        String rejectReason,
        Long currentAnswerId,
        String currentAnswerBody,
        Integer currentAnswerVersion,
        boolean wasCorrected, // version > 1
        Instant createdAt,
        Instant updatedAt) {
}