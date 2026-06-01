package com.sinoe.authmfa.dto.qa;

import java.time.Instant;
import java.util.List;

public record QuestionConversationDto(
        Long questionId,
        String title,
        String status,
        String scope,
        Instant createdAt,
        String rejectReason,
        String studentName,
        String studentEmail,
        String tutorName,
        String tutorEmail,
        boolean canReply,
        List<QuestionConversationMessageDto> messages
) {
}
