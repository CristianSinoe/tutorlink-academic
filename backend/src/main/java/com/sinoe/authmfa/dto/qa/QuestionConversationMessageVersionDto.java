package com.sinoe.authmfa.dto.qa;

import java.time.Instant;

public record QuestionConversationMessageVersionDto(
        Long id,
        Integer version,
        String body,
        Instant createdAt,
        boolean current,
        boolean original
) {
}
