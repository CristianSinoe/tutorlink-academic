// src/main/java/com/sinoe/authmfa/dto/qa/TutorHistoryItemDto.java
package com.sinoe.authmfa.dto.qa;

public record TutorHistoryItemDto(
        Long id,
        String title,
        String status,
        String scope,
        String answeredAt,
        String studentName,
        String studentEmail
) {}
