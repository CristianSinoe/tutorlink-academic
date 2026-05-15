package com.sinoe.authmfa.dto.qa;

public record TutorDashboardSummaryDto(
        long pendingCount,
        long todayAnsweredCount,
        long totalAnswers
) {}
