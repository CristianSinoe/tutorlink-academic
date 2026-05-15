package com.sinoe.authmfa.dto.qa;

import java.time.Instant;

// Historial versionado de respuestas
public record AnswerHistoryDto(
    Long id,
    Integer version,
    String body,
    Instant createdAt
) {}