package com.sinoe.authmfa.dto.qa;

import java.time.Instant;
import java.util.List;

public record QuestionConversationMessageDto(
        Long id,
        String authorName,
        String authorRole,
        String body,
        Instant createdAt,
        String sourceType,
        boolean legacy,
        boolean currentAnswer,
        boolean corrected,
        boolean canCorrect,
        List<QuestionConversationMessageVersionDto> versions
) {
}
