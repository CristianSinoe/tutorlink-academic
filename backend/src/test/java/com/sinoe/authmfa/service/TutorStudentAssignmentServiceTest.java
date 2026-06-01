package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.user.Student;
import com.sinoe.authmfa.domain.user.StudentRepository;
import com.sinoe.authmfa.domain.user.Tutor;
import com.sinoe.authmfa.domain.user.TutorRepository;
import com.sinoe.authmfa.domain.user.TutorStudent;
import com.sinoe.authmfa.domain.user.TutorStudentRepository;
import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.dto.AdminUserDtos;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TutorStudentAssignmentServiceTest {

    @Mock
    private TutorRepository tutors;

    @Mock
    private StudentRepository students;

    @Mock
    private UserRepository users;

    @Mock
    private TutorStudentRepository tutorStudents;

    private TutorStudentAssignmentService service;

    @BeforeEach
    void setUp() {
        service = new TutorStudentAssignmentService(tutors, students, users, tutorStudents);
    }

    @Test
    void shouldAssignStudentToTutorSuccessfully() {
        AdminUserDtos.AssignStudentToTutor dto = AdminUserDtos.AssignStudentToTutor.builder()
                .tutorCode("T001")
                .matricula("A001")
                .build();
        Tutor tutor = Tutor.builder().id(10L).tutorCode("T001").build();
        Student student = Student.builder().id(20L).matricula("A001").build();
        User admin = User.builder().id(30L).build();
        when(tutors.findByTutorCode("T001")).thenReturn(Optional.of(tutor));
        when(students.findByMatricula("A001")).thenReturn(Optional.of(student));
        when(tutorStudents.findByStudent_Id(20L)).thenReturn(Optional.empty());
        when(users.findById(30L)).thenReturn(Optional.of(admin));
        when(tutorStudents.save(any(TutorStudent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.assignStudentToTutor(dto, 30L);

        ArgumentCaptor<TutorStudent> captor = ArgumentCaptor.forClass(TutorStudent.class);
        verify(tutorStudents).save(captor.capture());
        TutorStudent saved = captor.getValue();
        assertEquals(tutor, saved.getTutor());
        assertEquals(student, saved.getStudent());
        assertEquals(admin, saved.getCreatedBy());
    }

    @Test
    void shouldReplacePreviousAssignmentBeforeSavingNewOne() {
        AdminUserDtos.AssignStudentToTutor dto = AdminUserDtos.AssignStudentToTutor.builder()
                .tutorCode("T001")
                .matricula("A001")
                .build();
        Tutor tutor = Tutor.builder().id(10L).tutorCode("T001").build();
        Student student = Student.builder().id(20L).matricula("A001").build();
        TutorStudent existing = TutorStudent.builder().id(99L).student(student).build();
        when(tutors.findByTutorCode("T001")).thenReturn(Optional.of(tutor));
        when(students.findByMatricula("A001")).thenReturn(Optional.of(student));
        when(tutorStudents.findByStudent_Id(20L)).thenReturn(Optional.of(existing));

        service.assignStudentToTutor(dto, null);

        verify(tutorStudents).delete(existing);
        verify(tutorStudents).save(any(TutorStudent.class));
    }

    @Test
    void shouldFailWhenTutorDoesNotExist() {
        AdminUserDtos.AssignStudentToTutor dto = AdminUserDtos.AssignStudentToTutor.builder()
                .tutorCode("T404")
                .matricula("A001")
                .build();
        when(tutors.findByTutorCode("T404")).thenReturn(Optional.empty());

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.assignStudentToTutor(dto, 30L));

        assertEquals("Tutor no encontrado con código: T404", error.getMessage());
        verify(tutorStudents, never()).save(any(TutorStudent.class));
    }

    @Test
    void shouldFailWhenStudentDoesNotExist() {
        AdminUserDtos.AssignStudentToTutor dto = AdminUserDtos.AssignStudentToTutor.builder()
                .tutorCode("T001")
                .matricula("A404")
                .build();
        Tutor tutor = Tutor.builder().id(10L).tutorCode("T001").build();
        when(tutors.findByTutorCode("T001")).thenReturn(Optional.of(tutor));
        when(students.findByMatricula("A404")).thenReturn(Optional.empty());

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.assignStudentToTutor(dto, 30L));

        assertEquals("Estudiante no encontrado con matrícula: A404", error.getMessage());
        verify(tutorStudents, never()).save(any(TutorStudent.class));
    }

    @Test
    void shouldLeaveCreatedByNullWhenAdminUserIdIsNullOrMissing() {
        AdminUserDtos.AssignStudentToTutor dto = AdminUserDtos.AssignStudentToTutor.builder()
                .tutorCode("T001")
                .matricula("A001")
                .build();
        Tutor tutor = Tutor.builder().id(10L).tutorCode("T001").build();
        Student student = Student.builder().id(20L).matricula("A001").build();
        when(tutors.findByTutorCode("T001")).thenReturn(Optional.of(tutor));
        when(students.findByMatricula("A001")).thenReturn(Optional.of(student));
        when(tutorStudents.findByStudent_Id(20L)).thenReturn(Optional.empty());
        when(tutorStudents.save(any(TutorStudent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(users.findById(30L)).thenReturn(Optional.empty());

        service.assignStudentToTutor(dto, null);
        service.assignStudentToTutor(dto, 30L);

        ArgumentCaptor<TutorStudent> captor = ArgumentCaptor.forClass(TutorStudent.class);
        verify(tutorStudents, org.mockito.Mockito.times(2)).save(captor.capture());
        assertNull(captor.getAllValues().get(0).getCreatedBy());
        assertNull(captor.getAllValues().get(1).getCreatedBy());
    }
}
