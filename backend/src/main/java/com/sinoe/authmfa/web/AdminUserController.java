package com.sinoe.authmfa.web;

import com.sinoe.authmfa.domain.user.Student;
import com.sinoe.authmfa.domain.user.Tutor;
import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.domain.user.UserRole;
import com.sinoe.authmfa.dto.AdminUserDtos;
import com.sinoe.authmfa.dto.AuthDtos;
import com.sinoe.authmfa.dto.TutorStudentAssignmentDto;
import com.sinoe.authmfa.service.AdminUserService;
import com.sinoe.authmfa.service.ExcelImportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.sinoe.authmfa.dto.StudentSuggestionDto;

import java.util.List;
import java.util.stream.Collectors;
import java.util.function.Function;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final ExcelImportService excelImportService;
    private final UserRepository users;

    // DTO simple para listar usuarios
    record UserRow(
            Long id,
            String name,
            String lastNamePaterno,
            String lastNameMaterno,
            String email,
            String role,
            String status,
            String career,
            Integer semester,
            Boolean assigned,
            String department,
            String specialty,
            Boolean hasAssignments) {
    }

    @GetMapping
    public ResponseEntity<List<UserRow>> listAll() {
        var studentProfiles = adminUserService.listStudentsWithProfile().stream()
                .collect(Collectors.toMap(AdminUserDtos.StudentListItem::getId, Function.identity()));
        var tutorProfiles = adminUserService.listTutorsWithProfile().stream()
                .collect(Collectors.toMap(AdminUserDtos.TutorListRow::getId, Function.identity()));
        List<UserRow> list = users.findAll()
                .stream()
                .map(u -> {
                    var student = studentProfiles.get(u.getId());
                    var tutor = tutorProfiles.get(u.getId());
                    return new UserRow(
                            u.getId(),
                            u.getName(),
                            u.getLastNamePaterno(),
                            u.getLastNameMaterno(),
                            u.getEmail(),
                            u.getRole() != null ? u.getRole().name() : null,
                            u.getStatus() != null ? u.getStatus().name() : null,
                            student != null ? student.getCareer() : null,
                            student != null ? student.getSemester() : null,
                            student != null ? student.isAssigned() : null,
                            tutor != null ? tutor.getDepartment() : null,
                            tutor != null ? tutor.getSpecialty() : null,
                            tutor != null ? tutor.isHasAssignments() : null);
                })
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/students")
    public ResponseEntity<List<AdminUserDtos.StudentListItem>> listStudents() {
        var list = adminUserService.listStudentsWithProfile();
        return ResponseEntity.ok(list);
    }

    @PostMapping("/students")
    public ResponseEntity<AuthDtos.ApiMessage> createStudent(
            @Valid @RequestBody AdminUserDtos.CreateStudentUser dto,
            HttpServletRequest request) {
        Student s = adminUserService.createStudentUser(dto, resolveFrontendBaseUrl(request));
        return ResponseEntity.ok(new AuthDtos.ApiMessage("Student user created with id=" + s.getId()));
    }

    @PutMapping("/students/{userId}")
    public ResponseEntity<AuthDtos.ApiMessage> updateStudent(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody AdminUserDtos.UpdateStudentUser dto) {
        Student s = adminUserService.updateStudentUser(userId, dto);
        return ResponseEntity.ok(new AuthDtos.ApiMessage("Student user updated with studentId=" + s.getId()));
    }

    @PostMapping("/tutors")
    public ResponseEntity<AuthDtos.ApiMessage> createTutor(
            @Valid @RequestBody AdminUserDtos.CreateTutorUser dto,
            HttpServletRequest request) {
        Tutor t = adminUserService.createTutorUser(dto, resolveFrontendBaseUrl(request));
        return ResponseEntity.ok(new AuthDtos.ApiMessage("Tutor user created with id=" + t.getId()));
    }

    @PostMapping("/students/import-csv")
    public ResponseEntity<AdminUserDtos.CsvImportResult> importStudentsCsv(
            @Valid @RequestBody AdminUserDtos.CsvTextRequest dto,
            HttpServletRequest request) {
        var result = adminUserService.importStudentsFromCsv(dto.getCsv(), resolveFrontendBaseUrl(request));
        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/students/import-excel", consumes = "multipart/form-data")
    public ResponseEntity<AdminUserDtos.CsvImportResult> importStudentsExcel(
            @RequestParam("file") MultipartFile file, HttpServletRequest request) {
        String rows = excelImportService.readRows(file, 9);
        return ResponseEntity.ok(adminUserService.importStudentsFromCsv(rows, resolveFrontendBaseUrl(request)));
    }

    @PostMapping("/tutors/import-csv")
    public ResponseEntity<AdminUserDtos.CsvImportResult> importTutorsCsv(
            @Valid @RequestBody AdminUserDtos.CsvTextRequest dto,
            HttpServletRequest request) {
        var result = adminUserService.importTutorsFromCsv(dto.getCsv(), resolveFrontendBaseUrl(request));
        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/tutors/import-excel", consumes = "multipart/form-data")
    public ResponseEntity<AdminUserDtos.CsvImportResult> importTutorsExcel(
            @RequestParam("file") MultipartFile file, HttpServletRequest request) {
        String rows = excelImportService.readRows(file, 8);
        return ResponseEntity.ok(adminUserService.importTutorsFromCsv(rows, resolveFrontendBaseUrl(request)));
    }

    @PatchMapping("/{userId}/status")
    public ResponseEntity<AuthDtos.ApiMessage> changeStatus(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody AdminUserDtos.ChangeUserStatus dto,
            Authentication auth) {
        Long actorUserId = null;
        if (auth != null && auth.getName() != null) {
            actorUserId = users.findByEmail(auth.getName())
                    .map(User::getId)
                    .orElse(null);
        }

        User u = adminUserService.changeUserStatus(userId, dto.getStatus(), actorUserId);
        return ResponseEntity.ok(new AuthDtos.ApiMessage("Estado actualizado a " + u.getStatus().name()));
    }

    @PostMapping("/tutor-students/assign")
    public ResponseEntity<AuthDtos.ApiMessage> assignStudentToTutor(
            @Valid @RequestBody AdminUserDtos.AssignStudentToTutor dto,
            Authentication auth) {

        Long adminId = null;
        if (auth != null && auth.getName() != null) {
            var opt = users.findByEmail(auth.getName());
            if (opt.isPresent()) {
                adminId = opt.get().getId();
            }
        }

        adminUserService.assignStudentToTutor(dto, adminId);
        return ResponseEntity.ok(
                new AuthDtos.ApiMessage("Estudiante " + dto.getMatricula()
                        + " asignado a tutor " + dto.getTutorCode()));
    }

    @PostMapping("/tutor-students/import-csv")
    public ResponseEntity<AdminUserDtos.AssignTutorStudentsCsvResult> importTutorStudentsCsv(
            @Valid @RequestBody AdminUserDtos.AssignTutorStudentsCsvRequest dto,
            Authentication auth) {
        Long adminId = null;
        if (auth != null && auth.getName() != null) {
            var opt = users.findByEmail(auth.getName());
            if (opt.isPresent()) {
                adminId = opt.get().getId();
            }
        }

        var result = adminUserService.importTutorStudentAssignmentsFromCsv(dto.getCsv(), adminId);
        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/tutor-students/import-excel", consumes = "multipart/form-data")
    public ResponseEntity<AdminUserDtos.AssignTutorStudentsCsvResult> importTutorStudentsExcel(
            @RequestParam("file") MultipartFile file, Authentication auth) {
        Long adminId = auth == null || auth.getName() == null ? null
                : users.findByEmail(auth.getName()).map(User::getId).orElse(null);
        String rows = excelImportService.readRows(file, 2);
        return ResponseEntity.ok(adminUserService.importTutorStudentAssignmentsFromCsv(rows, adminId));
    }

    @GetMapping("/tutor-students")
    public ResponseEntity<List<TutorStudentAssignmentDto>> listAssignments(
            @RequestParam(name = "tutorCode", required = false) String tutorCode,
            @RequestParam(name = "matricula", required = false) String matricula) {

        List<TutorStudentAssignmentDto> list = adminUserService.listTutorStudentAssignments(tutorCode, matricula);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/tutors")
    public ResponseEntity<List<AdminUserDtos.TutorListRow>> listTutors() {
        var list = adminUserService.listTutorsWithProfile();
        return ResponseEntity.ok(list);
    }

    @PutMapping("/tutors/{userId}")
    public ResponseEntity<AuthDtos.ApiMessage> updateTutor(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody AdminUserDtos.UpdateTutorUser dto) {
        Tutor t = adminUserService.updateTutorUser(userId, dto);
        return ResponseEntity.ok(new AuthDtos.ApiMessage("Tutor user updated with tutorId=" + t.getId()));
    }

    @DeleteMapping("/tutor-students/{id}")
    public ResponseEntity<AuthDtos.ApiMessage> deleteTutorStudentAssignment(@PathVariable("id") Long id) {
        adminUserService.deleteTutorStudentAssignment(id);
        return ResponseEntity.ok(new AuthDtos.ApiMessage("Asignación eliminada correctamente"));
    }

    @GetMapping("/tutor-students/suggest-students")
    public ResponseEntity<List<StudentSuggestionDto>> suggestUnassignedStudents(
            @RequestParam(name = "q", required = false) String query
    ) {
        java.util.List<StudentSuggestionDto> suggestions =
                adminUserService.suggestUnassignedStudents(query);
        return ResponseEntity.ok(suggestions);
    }

    @GetMapping("/admins")
    public ResponseEntity<List<UserRow>> listAdmins() {
        List<UserRow> list = users.findByRole(UserRole.ADMIN)
                .stream()
                .map(u -> new UserRow(
                        u.getId(),
                        u.getName(),
                        u.getLastNamePaterno(),
                        u.getLastNameMaterno(),
                        u.getEmail(),
                        u.getRole() != null ? u.getRole().name() : null,
                        u.getStatus() != null ? u.getStatus().name() : null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                ))
                .toList();
        return ResponseEntity.ok(list);
    }

    @PostMapping("/admins")
    public ResponseEntity<AuthDtos.ApiMessage> createAdmin(
            @Valid @RequestBody AdminUserDtos.CreateAdminUser dto,
            HttpServletRequest request) {
        User u = adminUserService.createAdminUser(dto, resolveFrontendBaseUrl(request));
        return ResponseEntity.ok(new AuthDtos.ApiMessage("Admin user created with id=" + u.getId()));
    }

    private static String resolveFrontendBaseUrl(HttpServletRequest request) {
        String origin = trimToNull(request.getHeader("Origin"));
        if (origin != null) {
            return stripTrailingSlash(origin);
        }

        String referer = trimToNull(request.getHeader("Referer"));
        if (referer != null) {
            try {
                java.net.URI uri = java.net.URI.create(referer);
                if (uri.getScheme() != null && uri.getAuthority() != null) {
                    return stripTrailingSlash(uri.getScheme() + "://" + uri.getAuthority());
                }
            } catch (IllegalArgumentException ignored) {
                // cae al fallback por host
            }
        }

        String scheme = request.getScheme();
        String host = request.getServerName();
        return scheme + "://" + host + ":5173";
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String stripTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
