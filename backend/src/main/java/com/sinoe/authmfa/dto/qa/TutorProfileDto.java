package com.sinoe.authmfa.dto.qa;

public record TutorProfileDto(
        String bio,
        String academicLink,
        String professionalLink,
        Boolean notifyNewQuestions,
        Boolean weeklySummary
) {
}
