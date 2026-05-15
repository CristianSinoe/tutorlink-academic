package com.sinoe.authmfa.dto;

public record StudentSuggestionDto(
        Long studentId,
        String matricula,
        String fullName,
        String email
) {}
