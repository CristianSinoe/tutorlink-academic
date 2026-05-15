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
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.sinoe.authmfa.dto.StudentSuggestionDto;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final UserRepository users;

    // DTO simple para listar usuarios
    record UserRow(
            Long id,
            String name,
            String lastNamePaterno,
            String lastNameMaterno,
            String email,
            String role,
            String status) {
    }

    @GetMapping
    public ResponseEntity<List<UserRow>> listAll() {
        List<UserRow> list = users.findAll()
                .stream()
                .map(u -> new UserRow(
                        u.getId(),
                        u.getName(),
                        u.getLastNamePaterno(),
                        u.getLastNameMaterno(),
                        u.getEmail(),
                        u.getRole() != null ? u.getRole().name() : null,
                        u.getStatus() != null ? u.getStatus().name() : null))
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/students")
    public ResponseEntity<List<AdminUserDtos.StudentListItem>> listStudents() {
        var list = adminUserService.listStudentsWithProfile();
        return ResponseEntity.ok(list);
    }

    @PostMapping("/students")
    public ResponseEntity<AuthDtos.ApiMessage> createStudent(@Valid @RequestBody AdminUserDtos.CreateStudentUser dto) {
        Student s = adminUserService.createStudentUser(dto);
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
    public ResponseEntity<AuthDtos.ApiMessage> createTutor(@Valid @RequestBody AdminUserDtos.CreateTutorUser dto) {
        Tutor t = adminUserService.createTutorUser(dto);
        return ResponseEntity.ok(new AuthDtos.ApiMessage("Tutor user created with id=" + t.getId()));
    }

    @PostMapping("/students/import-csv")
    public ResponseEntity<AdminUserDtos.CsvImportResult> importStudentsCsv(
            @Valid @RequestBody AdminUserDtos.CsvTextRequest dto) {
        var result = adminUserService.importStudentsFromCsv(dto.getCsv());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/tutors/import-csv")
    public ResponseEntity<AdminUserDtos.CsvImportResult> importTutorsCsv(
            @Valid @RequestBody AdminUserDtos.CsvTextRequest dto) {
        var result = adminUserService.importTutorsFromCsv(dto.getCsv());
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{userId}/status")
    public ResponseEntity<AuthDtos.ApiMessage> changeStatus(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody AdminUserDtos.ChangeUserStatus dto) {
        User u = adminUserService.changeUserStatus(userId, dto.getStatus());
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
                        u.getStatus() != null ? u.getStatus().name() : null
                ))
                .toList();
        return ResponseEntity.ok(list);
    }

    @PostMapping("/admins")
    public ResponseEntity<AuthDtos.ApiMessage> createAdmin(
            @Valid @RequestBody AdminUserDtos.CreateAdminUser dto) {
        User u = adminUserService.createAdminUser(dto);
        return ResponseEntity.ok(new AuthDtos.ApiMessage("Admin user created with id=" + u.getId()));
    }
}
