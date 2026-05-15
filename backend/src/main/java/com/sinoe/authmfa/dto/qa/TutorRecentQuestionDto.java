package com.sinoe.authmfa.dto.qa;

import java.time.Instant;

public record TutorRecentQuestionDto(
        Long id,
        String title,
        String status,
        String scope,
        Instant createdAt,
        String studentName,
        String studentEmail
) {}
