// src/main/java/com/sinoe/authmfa/dto/qa/TutorPendingQuestionDto.java
package com.sinoe.authmfa.dto.qa;

import java.time.Instant;

public record TutorPendingQuestionDto(
        Long id,
        String title,
        String status,
        String scope,
        Instant createdAt,
        String studentName,
        String studentEmail
) {}
