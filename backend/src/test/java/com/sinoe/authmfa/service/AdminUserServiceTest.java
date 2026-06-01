package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.user.StudentRepository;
import com.sinoe.authmfa.domain.user.TutorRepository;
import com.sinoe.authmfa.domain.user.TutorStudentRepository;
import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.domain.user.UserRole;
import com.sinoe.authmfa.domain.user.UserStatus;
import com.sinoe.authmfa.dto.AdminUserDtos;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository users;

    @Mock
    private StudentRepository students;

    @Mock
    private TutorRepository tutors;

    @Mock
    private UserService userService;

    @Mock
    private TutorStudentRepository tutorStudents;

    @Mock
    private TutorStudentAssignmentService tutorStudentAssignmentService;

    @Mock
    private EmailService emailService;

    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private ObjectProvider<AdminUserService> selfProvider;

    private AdminUserService service;

    @BeforeEach
    void setUp() {
        service = new AdminUserService(
                users,
                students,
                tutors,
                userService,
                tutorStudents,
                tutorStudentAssignmentService,
                emailService,
                passwordEncoder,
                selfProvider);
        lenient().when(selfProvider.getObject()).thenReturn(service);
    }

    @Test
    void shouldCreateAdminUserWithNormalizedEmailAndFirstLoginToken() {
        AdminUserDtos.CreateAdminUser dto = AdminUserDtos.CreateAdminUser.builder()
                .name("Ana")
                .lastNamePaterno("Lopez")
                .lastNameMaterno("Diaz")
                .email("  Admin.Demo@Example.COM ")
                .build();

        User createdUser = User.builder()
                .id(10L)
                .name("Ana")
                .lastNamePaterno("Lopez")
                .lastNameMaterno("Diaz")
                .email("admin.demo@example.com")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();

        when(users.existsByEmail("admin.demo@example.com")).thenReturn(false);
        when(userService.createUser(any(UserService.CreateUserCommand.class))).thenReturn(createdUser);
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Instant beforeCall = Instant.now();

        User result = service.createAdminUser(dto);

        ArgumentCaptor<UserService.CreateUserCommand> commandCaptor =
                ArgumentCaptor.forClass(UserService.CreateUserCommand.class);
        verify(userService).createUser(commandCaptor.capture());

        UserService.CreateUserCommand command = commandCaptor.getValue();
        assertEquals("admin.demo@example.com", command.email());
        assertEquals(UserRole.ADMIN, command.role());
        assertNotNull(command.rawPassword());
        assertFalse(command.rawPassword().isBlank());

        assertEquals(UserStatus.CREATED_BY_ADMIN, result.getStatus());
        assertNotNull(result.getFirstLoginToken());
        assertFalse(result.getFirstLoginToken().isBlank());
        assertNotNull(result.getFirstLoginExpiresAt());
        assertTrue(result.getFirstLoginExpiresAt().isAfter(beforeCall));

        verify(emailService).sendFirstLoginEmail("admin.demo@example.com", result.getFirstLoginToken());
    }

    @Test
    void shouldChangeUserStatusUsingCaseInsensitiveValue() {
        User user = User.builder()
                .id(7L)
                .email("student@example.com")
                .role(UserRole.ESTUDIANTE)
                .status(UserStatus.ACTIVE)
                .build();

        when(users.findById(7L)).thenReturn(Optional.of(user));
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User updated = service.changeUserStatus(7L, "disabled");

        assertEquals(UserStatus.DISABLED, updated.getStatus());
        verify(users).save(user);
    }

    @Test
    void shouldRejectInvalidUserStatusValue() {
        User user = User.builder()
                .id(8L)
                .email("student@example.com")
                .role(UserRole.ESTUDIANTE)
                .status(UserStatus.ACTIVE)
                .build();

        when(users.findById(8L)).thenReturn(Optional.of(user));

        IllegalArgumentException error =
                assertThrows(IllegalArgumentException.class, () -> service.changeUserStatus(8L, "paused"));

        assertEquals("Estado inválido: paused", error.getMessage());
        verify(users, never()).save(any(User.class));
    }

    @Test
    void shouldNotAllowUserToChangeOwnStatus() {
        User user = User.builder()
                .id(9L)
                .email("admin@example.com")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();
        when(users.findById(9L)).thenReturn(Optional.of(user));

        SecurityException error = assertThrows(
                SecurityException.class,
                () -> service.changeUserStatus(9L, "disabled", 9L));

        assertEquals("No puedes cambiar tu propio estado de usuario.", error.getMessage());
        verify(users, never()).save(any(User.class));
    }

    @Test
    void shouldFailWhenChangingStatusForUnknownUser() {
        when(users.findById(77L)).thenReturn(Optional.empty());

        EntityNotFoundException error = assertThrows(
                EntityNotFoundException.class,
                () -> service.changeUserStatus(77L, "active"));

        assertEquals("Usuario no encontrado: 77", error.getMessage());
    }

    @Test
    void shouldDelegateStudentAssignmentToAssignmentService() {
        AdminUserDtos.AssignStudentToTutor dto = AdminUserDtos.AssignStudentToTutor.builder()
                .tutorCode("T001")
                .matricula("A001")
                .build();

        service.assignStudentToTutor(dto, 12L);

        verify(tutorStudentAssignmentService).assignStudentToTutor(dto, 12L);
    }

    @Test
    void shouldReturnZeroCountersForEmptyAssignmentCsv() {
        AdminUserDtos.AssignTutorStudentsCsvResult result =
                service.importTutorStudentAssignmentsFromCsv("   ", 15L);

        assertEquals(0, result.getTotal());
        assertEquals(0, result.getAssigned());
        assertEquals(0, result.getErrors());
    }

    @Test
    void shouldCountAssignedAndErroredRowsWhenImportingAssignmentsFromCsv() {
        String csv = String.join("\n",
                "tutor;matricula",
                "T001;A001",
                "T002",
                "T003;A003");

        org.mockito.Mockito.doNothing()
                .doThrow(new IllegalArgumentException("boom"))
                .when(tutorStudentAssignmentService)
                .assignStudentToTutor(any(AdminUserDtos.AssignStudentToTutor.class), org.mockito.Mockito.eq(15L));

        AdminUserDtos.AssignTutorStudentsCsvResult result =
                service.importTutorStudentAssignmentsFromCsv(csv, 15L);

        assertEquals(3, result.getTotal());
        assertEquals(1, result.getAssigned());
        assertEquals(2, result.getErrors());
    }

    @Test
    void shouldRejectStudentUpdateWhenUserRoleIsNotStudent() {
        User admin = User.builder()
                .id(20L)
                .role(UserRole.ADMIN)
                .email("admin@example.com")
                .status(UserStatus.ACTIVE)
                .build();
        AdminUserDtos.UpdateStudentUser dto = AdminUserDtos.UpdateStudentUser.builder()
                .name("Ana")
                .lastNamePaterno("Lopez")
                .lastNameMaterno("Diaz")
                .email("ana@example.com")
                .matricula("A001")
                .career("ITI")
                .plan("2024")
                .semester(3)
                .birthDate(LocalDate.now().minusYears(20))
                .build();
        when(users.findById(20L)).thenReturn(Optional.of(admin));

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.updateStudentUser(20L, dto));

        assertEquals("El usuario no es un ESTUDIANTE", error.getMessage());
    }
}
