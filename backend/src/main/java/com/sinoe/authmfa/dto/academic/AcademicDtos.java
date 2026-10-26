package com.sinoe.authmfa.dto.academic;

import jakarta.validation.constraints.*;
import java.time.*;

public final class AcademicDtos {
    private AcademicDtos() { }
    public record PeriodRequest(@NotBlank String code, @NotBlank String name, @NotNull LocalDate startsOn, @NotNull LocalDate endsOn) { }
    public record CourseRequest(@NotBlank String code, @NotBlank String name, String description) { }
    public record PeriodUpdate(@NotBlank @Size(max=50) String code, @NotBlank @Size(max=140) String name,
        @NotNull LocalDate startsOn, @NotNull LocalDate endsOn,
        @NotBlank @Pattern(regexp="ACTIVE|INACTIVE") String status) { }
    public record CourseUpdate(@NotBlank @Size(max=50) String code, @NotBlank @Size(max=180) String name,
        String description, @NotNull Boolean active) { }
    public record GroupRequest(@NotNull Long courseId, @NotNull Long periodId, @NotBlank String code, @NotBlank String name) { }
    public record TeacherAssignmentRequest(@NotNull Long teacherId) { }
    public record EnrollmentRequest(@NotNull Long studentId) { }
    public record TeacherAssignmentView(Long teacherId, String code, String name,
                                        String lastNamePaterno, String lastNameMaterno,
                                        String department, String specialty, Instant assignedAt) { }
    public record EnrollmentView(Long studentId, String matricula, String name,
                                 String lastNamePaterno, String lastNameMaterno,
                                 String career, String plan, Integer semester,
                                 String status, Instant enrolledAt, Instant withdrawnAt) { }
    public record ContentRequest(@NotNull @Positive Long groupId, @NotBlank @Size(max=200) String title, @Size(max=20000) String body, boolean published) { }
    public record TaskRequest(@NotNull @Positive Long groupId, @NotBlank @Size(max=200) String title, @Size(max=20000) String instructions, @NotNull OffsetDateTime dueAt, boolean published, boolean allowLateSubmissions) { }
    public record ContentUpdate(@NotBlank @Size(max=200) String title, @Size(max=20000) String body, @NotNull Boolean published) { }
    public record TaskUpdate(@NotBlank @Size(max=200) String title, @Size(max=20000) String instructions, @NotNull OffsetDateTime dueAt, @NotNull Boolean published, @NotNull Boolean allowLateSubmissions) { }
    public record SubmissionRequest(String body, boolean finalSubmission) { }
    public record SessionRequest(@NotNull Long groupId, @NotNull OffsetDateTime startsAt, @NotNull OffsetDateTime endsAt, String topic) { }
    public record AttendanceRequest(@NotNull Long studentId, @NotBlank String status) { }
    public record CourseQuestionRequest(@NotNull Long groupId, Long targetTeacherId, @NotBlank @Size(max=200) String subject, @NotBlank String body) { }
    public record CourseQuestionMessageRequest(@NotBlank String body, boolean primaryAnswer, boolean close) { }
}
