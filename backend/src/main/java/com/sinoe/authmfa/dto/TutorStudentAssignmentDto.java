package com.sinoe.authmfa.dto;

import java.time.OffsetDateTime;

public record TutorStudentAssignmentDto(
        Long id,

        Long tutorId,
        String tutorCode,
        String tutorName,
        String tutorEmail,
        String tutorDepartment,
        String tutorSpecialty,

        Long studentId,
        String studentMatricula,
        String studentName,
        String studentEmail,

        OffsetDateTime createdAt
) {}
