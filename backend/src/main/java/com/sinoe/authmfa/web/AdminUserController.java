package com.sinoe.authmfa.web;

import com.sinoe.authmfa.domain.user.Student;
import com.sinoe.authmfa.domain.user.Tutor;
import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.domain.user.UserRole;
import com.sinoe.authmfa.dto.AdminUserDtos;
import com.sinoe.authmfa.dto.TutorStudentAssignmentDto;
import com.sinoe.authmfa.service.AdminUserService;
import jakarta.persistence.EntityNotFoundException;
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

    record ApiMessage(String message) {
    }

    // Listar todos los usuarios

    @GetMapping
    public ResponseEntity<?> listAll() {
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

    // Listar ESTUDIANTES (con estado, plan, birthDate, phone, etc.)

    @GetMapping("/students")
    public ResponseEntity<?> listStudents() {
        var list = adminUserService.listStudentsWithProfile();
        return ResponseEntity.ok(list);
    }

    // Crear usuario ESTUDIANTE + perfil

    @PostMapping("/students")
    public ResponseEntity<?> createStudent(@Valid @RequestBody AdminUserDtos.CreateStudentUser dto) {
        try {
            Student s = adminUserService.createStudentUser(dto);
            return ResponseEntity.ok(new ApiMessage("Student user created with id=" + s.getId()));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest().body(new ApiMessage(ex.getMessage()));
        }
    }

    // Actualizar usuario ESTUDIANTE + perfil

    @PutMapping("/students/{userId}")
    public ResponseEntity<?> updateStudent(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody AdminUserDtos.UpdateStudentUser dto) {
        try {
            Student s = adminUserService.updateStudentUser(userId, dto);
            return ResponseEntity.ok(new ApiMessage("Student user updated with studentId=" + s.getId()));
        } catch (EntityNotFoundException ex) {
            return ResponseEntity.status(404).body(new ApiMessage(ex.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest().body(new ApiMessage(ex.getMessage()));
        }
    }


    // Crear usuario TUTOR + perfil

    @PostMapping("/tutors")
    public ResponseEntity<?> createTutor(@Valid @RequestBody AdminUserDtos.CreateTutorUser dto) {
        try {
            Tutor t = adminUserService.createTutorUser(dto);
            return ResponseEntity.ok(new ApiMessage("Tutor user created with id=" + t.getId()));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest().body(new ApiMessage(ex.getMessage()));
        }
    }


    // Importar ESTUDIANTES desde CSV

    @PostMapping("/students/import-csv")
    public ResponseEntity<?> importStudentsCsv(
            @Valid @RequestBody AdminUserDtos.CsvTextRequest dto) {
        try {
            var result = adminUserService.importStudentsFromCsv(dto.getCsv());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiMessage(ex.getMessage()));
        }
    }


    // Importar TUTORES desde CSV

    @PostMapping("/tutors/import-csv")
    public ResponseEntity<?> importTutorsCsv(
            @Valid @RequestBody AdminUserDtos.CsvTextRequest dto) {
        try {
            var result = adminUserService.importTutorsFromCsv(dto.getCsv());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiMessage(ex.getMessage()));
        }
    }


    // Cambiar estado de usuario

    @PatchMapping("/{userId}/status")
    public ResponseEntity<?> changeStatus(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody AdminUserDtos.ChangeUserStatus dto) {
        try {
            User u = adminUserService.changeUserStatus(userId, dto.getStatus());
            return ResponseEntity.ok(new ApiMessage("Estado actualizado a " + u.getStatus().name()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiMessage(ex.getMessage()));
        }
    }


    // Asignar estudiante a tutor

    @PostMapping("/tutor-students/assign")
    public ResponseEntity<?> assignStudentToTutor(
            @Valid @RequestBody AdminUserDtos.AssignStudentToTutor dto,
            Authentication auth) {

        Long adminId = null;
        if (auth != null && auth.getName() != null) {
            var opt = users.findByEmail(auth.getName());
            if (opt.isPresent()) {
                adminId = opt.get().getId();
            }
        }

        try {
            adminUserService.assignStudentToTutor(dto, adminId);
            return ResponseEntity.ok(
                    new ApiMessage("Estudiante " + dto.getMatricula()
                            + " asignado a tutor " + dto.getTutorCode()));
        } catch (jakarta.persistence.EntityNotFoundException ex) {
            return ResponseEntity.status(404).body(new ApiMessage(ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiMessage(ex.getMessage()));
        }
    }


    // Asignación masiva de estudiantes a tutores vía CSV

    @PostMapping("/tutor-students/import-csv")
    public ResponseEntity<?> importTutorStudentsCsv(
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


    // Listar asignaciones TUTOR–ESTUDIANTE

    @GetMapping("/tutor-students")
    public ResponseEntity<?> listAssignments(
            @RequestParam(name = "tutorCode", required = false) String tutorCode,
            @RequestParam(name = "matricula", required = false) String matricula) {

        List<TutorStudentAssignmentDto> list = adminUserService.listTutorStudentAssignments(tutorCode, matricula);
        return ResponseEntity.ok(list);
    }


    // Listar TUTORES (con estado, depto, phone, etc.)

    @GetMapping("/tutors")
    public ResponseEntity<?> listTutors() {
        var list = adminUserService.listTutorsWithProfile();
        return ResponseEntity.ok(list);
    }


    // Actualizar usuario TUTOR + perfil

    @PutMapping("/tutors/{userId}")
    public ResponseEntity<?> updateTutor(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody AdminUserDtos.UpdateTutorUser dto) {
        try {
            Tutor t = adminUserService.updateTutorUser(userId, dto);
            return ResponseEntity.ok(new ApiMessage("Tutor user updated with tutorId=" + t.getId()));
        } catch (EntityNotFoundException ex) {
            return ResponseEntity.status(404).body(new ApiMessage(ex.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest().body(new ApiMessage(ex.getMessage()));
        }
    }


    // Eliminar asignación TUTOR–ESTUDIANTE (DELETE)

    @DeleteMapping("/tutor-students/{id}")
    public ResponseEntity<?> deleteTutorStudentAssignment(@PathVariable("id") Long id) {
        try {
            adminUserService.deleteTutorStudentAssignment(id);
            return ResponseEntity.ok(new ApiMessage("Asignación eliminada correctamente"));
        } catch (EntityNotFoundException ex) {
            return ResponseEntity.status(404).body(new ApiMessage(ex.getMessage()));
        }
    }


    // Sugerencias de estudiantes NO asignados
    // (para autocomplete del input de matrícula)

    @GetMapping("/tutor-students/suggest-students")
    public ResponseEntity<?> suggestUnassignedStudents(
            @RequestParam(name = "q", required = false) String query
    ) {
        java.util.List<StudentSuggestionDto> suggestions =
                adminUserService.suggestUnassignedStudents(query);
        return ResponseEntity.ok(suggestions);
    }


    // Listar administradores

    @GetMapping("/admins")
    public ResponseEntity<?> listAdmins() {
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


    // Crear usuario ADMIN

    @PostMapping("/admins")
    public ResponseEntity<?> createAdmin(
            @Valid @RequestBody AdminUserDtos.CreateAdminUser dto) {
        try {
            User u = adminUserService.createAdminUser(dto);
            return ResponseEntity.ok(new ApiMessage("Admin user created with id=" + u.getId()));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest().body(new ApiMessage(ex.getMessage()));
        }
    }
}
