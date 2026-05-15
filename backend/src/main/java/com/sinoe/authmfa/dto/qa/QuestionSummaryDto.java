package com.sinoe.authmfa.dto.qa;

import java.time.Instant;

// Para listas (student/tutor)
public record QuestionSummaryDto(
        Long id,
        String title,
        String status, // PENDIENTE/PUBLICADA/CORREGIDA/RECHAZADA
        String scope, // GENERAL/PLAN/PROGRAMA/SEMESTRE/ACADEMICO
        Instant createdAt) {
}