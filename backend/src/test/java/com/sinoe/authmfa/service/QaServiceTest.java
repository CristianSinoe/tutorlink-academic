package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.qa.*;
import com.sinoe.authmfa.domain.user.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QaServiceTest {

    @Mock
    private UserRepository users;
    @Mock
    private StudentRepository students;
    @Mock
    private TutorRepository tutors;
    @Mock
    private QuestionRepository questions;
    @Mock
    private AnswerRepository answers;
    @Mock
    private TutorStudentRepository tutorStudentRepository;

    private QaService service;

    @BeforeEach
    void setUp() {
        service = new QaService(users, students, tutors, questions, answers, tutorStudentRepository);
    }

    @Test
    void shouldCreateQuestionWithAssignedTutorWhenStudentHasAssignment() {
        Student student = Student.builder().id(10L).matricula("S001").build();
        Tutor tutor = Tutor.builder().id(20L).tutorCode("T001").build();
        TutorStudent assignment = TutorStudent.builder().student(student).tutor(tutor).build();

        when(students.findById(10L)).thenReturn(Optional.of(student));
        when(tutorStudentRepository.findByStudent_Id(10L)).thenReturn(Optional.of(assignment));
        when(questions.save(any(Question.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Question created = service.createQuestion(10L, Scope.GENERAL, "Titulo", "Contenido");

        assertEquals(student, created.getStudent());
        assertEquals(tutor, created.getTutor());
        assertEquals(Status.PENDIENTE, created.getStatus());
        assertEquals("Titulo", created.getTitle());
        assertEquals("Contenido", created.getBody());
    }

    @Test
    void shouldCreateQuestionWithoutTutorWhenStudentHasNoAssignment() {
        Student student = Student.builder().id(11L).matricula("S002").build();

        when(students.findById(11L)).thenReturn(Optional.of(student));
        when(tutorStudentRepository.findByStudent_Id(11L)).thenReturn(Optional.empty());
        when(questions.save(any(Question.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Question created = service.createQuestion(11L, Scope.SEMESTRE, "Duda", "Pregunta");

        assertEquals(student, created.getStudent());
        assertNull(created.getTutor());
        assertEquals(Status.PENDIENTE, created.getStatus());
        assertEquals(Scope.SEMESTRE, created.getScope());
    }

    @Test
    void shouldPublishFirstAnswerWithVersionOne() {
        Tutor tutor = Tutor.builder().id(30L).build();
        Question question = Question.builder().id(40L).status(Status.PENDIENTE).build();

        when(tutors.findByUser_Id(99L)).thenReturn(Optional.of(tutor));
        when(questions.findById(40L)).thenReturn(Optional.of(question));
        when(answers.save(any(Answer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(questions.save(any(Question.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Answer answer = service.publishOrCorrect(99L, 40L, "Respuesta", false);

        assertEquals(1, answer.getVersion());
        assertEquals(tutor, answer.getTutor());
        assertEquals(question, answer.getQuestion());
        assertEquals(Status.PUBLICADA, question.getStatus());
        assertEquals(answer, question.getCurrentAnswer());
        assertEquals(tutor, question.getTutor());
    }

    @Test
    void shouldCreateCorrectionWithIncrementedVersion() {
        Tutor tutor = Tutor.builder().id(31L).build();
        Answer previous = Answer.builder().id(100L).version(2).build();
        Question question = Question.builder()
                .id(41L)
                .status(Status.PUBLICADA)
                .currentAnswer(previous)
                .build();

        when(tutors.findByUser_Id(101L)).thenReturn(Optional.of(tutor));
        when(questions.findById(41L)).thenReturn(Optional.of(question));
        when(answers.save(any(Answer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(questions.save(any(Question.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Answer answer = service.publishOrCorrect(101L, 41L, "Correccion", true);

        assertEquals(3, answer.getVersion());
        assertEquals(Status.CORREGIDA, question.getStatus());
        assertEquals(answer, question.getCurrentAnswer());
    }

    @Test
    void shouldRejectPendingQuestionAndClearCurrentAnswer() {
        Tutor tutor = Tutor.builder().id(32L).build();
        Question question = Question.builder()
                .id(42L)
                .status(Status.PENDIENTE)
                .currentAnswer(Answer.builder().id(7L).version(1).build())
                .build();

        when(tutors.findByUser_Id(102L)).thenReturn(Optional.of(tutor));
        when(questions.findById(42L)).thenReturn(Optional.of(question));

        service.reject(102L, 42L, "Falta contexto");

        assertEquals(Status.RECHAZADA, question.getStatus());
        assertEquals("Falta contexto", question.getRejectReason());
        assertNull(question.getCurrentAnswer());
        verify(questions).save(question);
    }

    @Test
    void shouldRejectCorrectionWhenQuestionHasNoPreviousAnswer() {
        Tutor tutor = Tutor.builder().id(33L).build();
        Question question = Question.builder().id(43L).status(Status.PENDIENTE).build();

        when(tutors.findByUser_Id(103L)).thenReturn(Optional.of(tutor));
        when(questions.findById(43L)).thenReturn(Optional.of(question));

        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> service.publishOrCorrect(103L, 43L, "Correccion", true));

        assertEquals("No hay respuesta previa", error.getMessage());
        verify(answers, never()).save(any());
    }

    @Test
    void shouldReclassifyQuestionWhenScopeChanges() {
        Tutor tutor = Tutor.builder().id(34L).build();
        Question question = Question.builder().id(44L).scope(Scope.GENERAL).status(Status.PENDIENTE).build();

        when(tutors.findByUser_Id(104L)).thenReturn(Optional.of(tutor));
        when(questions.findById(44L)).thenReturn(Optional.of(question));

        service.reclassify(104L, 44L, Scope.PLAN);

        assertEquals(Scope.PLAN, question.getScope());
        verify(questions).save(question);
    }
}
