package com.sinoe.authmfa.dto;

import java.time.LocalDate;

public record MeResponseDto(
        Long id,
        String name,
        String lastNamePaterno,
        String lastNameMaterno,
        String lastName,        // legacy concatenado
        String email,
        String role,

        // Campos solo para STUDENT
        String matricula,
        String career,
        String plan,
        String semester,
        String studentPhone,
        LocalDate birthDate,

        // Campos solo para TUTOR
        String tutorCode,
        String department,
        String specialty,
        String tutorPhone
) {}
