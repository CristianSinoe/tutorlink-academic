package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.qa.*;
import com.sinoe.authmfa.domain.user.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
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
    private QuestionMessageRepository questionMessages;
    @Mock
    private QuestionMessageRevisionRepository questionMessageRevisions;
    @Mock
    private TutorStudentRepository tutorStudentRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private ObjectProvider<QaService> selfProvider;

    private QaService service;

    @BeforeEach
    void setUp() {
        service = new QaService(
                users,
                students,
                tutors,
                questions,
                answers,
                questionMessages,
                questionMessageRevisions,
                tutorStudentRepository,
                emailService,
                selfProvider);
        lenient().when(selfProvider.getObject()).thenReturn(service);
    }

    @Test
    void shouldCreateQuestionWithAssignedTutorWhenStudentHasAssignment() {
        User studentUser = User.builder().id(100L).role(UserRole.ESTUDIANTE).name("Pedro").email("student@example.com").build();
        User tutorUser = User.builder().id(200L).role(UserRole.TUTOR).name("Tutor").email("tutor@example.com").build();
        Student student = Student.builder().id(10L).matricula("S001").user(studentUser).build();
        Tutor tutor = Tutor.builder().id(20L).tutorCode("T001").user(tutorUser).build();
        TutorStudent assignment = TutorStudent.builder().student(student).tutor(tutor).build();

        when(students.findById(10L)).thenReturn(Optional.of(student));
        when(tutorStudentRepository.findByStudent_Id(10L)).thenReturn(Optional.of(assignment));
        when(questions.save(any(Question.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(questionMessages.save(any(QuestionMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Question created = service.createQuestion(10L, Scope.GENERAL, "Titulo", "Contenido");

        assertEquals(student, created.getStudent());
        assertEquals(tutor, created.getTutor());
        assertEquals(Status.PENDIENTE, created.getStatus());
        assertEquals("Titulo", created.getTitle());
        assertEquals("Contenido", created.getBody());
        verify(questionMessages).save(any(QuestionMessage.class));
        verify(emailService).sendTutorNewQuestionEmail(
                eq("tutor@example.com"),
                eq("Pedro"),
                eq("Titulo"),
                any(),
                any(),
                isNull());
    }

    @Test
    void shouldCreateQuestionWithoutTutorWhenStudentHasNoAssignment() {
        User studentUser = User.builder().id(101L).role(UserRole.ESTUDIANTE).name("Ana").build();
        Student student = Student.builder().id(11L).matricula("S002").user(studentUser).build();

        when(students.findById(11L)).thenReturn(Optional.of(student));
        when(tutorStudentRepository.findByStudent_Id(11L)).thenReturn(Optional.empty());
        when(questions.save(any(Question.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(questionMessages.save(any(QuestionMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Question created = service.createQuestion(11L, Scope.SEMESTRE, "Duda", "Pregunta");

        assertEquals(student, created.getStudent());
        assertNull(created.getTutor());
        assertEquals(Status.PENDIENTE, created.getStatus());
        assertEquals(Scope.SEMESTRE, created.getScope());
        verify(emailService, never()).sendTutorNewQuestionEmail(any(), any(), any(), any(), any(), any());
    }

    @Test
    void shouldRejectQuestionWithEmptyBody() {
        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.createQuestion(10L, Scope.GENERAL, "Titulo", "   "));

        assertEquals("El mensaje no puede estar vacío", error.getMessage());
        verifyNoInteractions(students, questions, questionMessages);
    }

    @Test
    void shouldRejectQuestionWhenBodyExceedsMaximumLength() {
        String body = "a".repeat(8001);

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.createQuestion(10L, Scope.GENERAL, "Titulo", body));

        assertEquals("El mensaje excede la longitud máxima permitida", error.getMessage());
        verifyNoInteractions(students, questions, questionMessages);
    }

    @Test
    void shouldPublishFirstAnswerWithVersionOne() {
        User tutorUser = User.builder().id(300L).role(UserRole.TUTOR).name("Laura Tutor").email("tutor@example.com").build();
        User studentUser = User.builder().id(301L).role(UserRole.ESTUDIANTE).name("Alumno").email("student@example.com").build();
        Tutor tutor = Tutor.builder().id(30L).user(tutorUser).build();
        Student student = Student.builder().id(50L).user(studentUser).build();
        Question question = Question.builder().id(40L).status(Status.PENDIENTE).student(student).tutor(tutor).title("Q1").build();

        when(tutors.findByUser_Id(99L)).thenReturn(Optional.of(tutor));
        when(questions.findById(40L)).thenReturn(Optional.of(question));
        when(questionMessages.save(any(QuestionMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(answers.save(any(Answer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(questions.save(any(Question.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Answer answer = service.publishOrCorrect(99L, 40L, "Respuesta", false);

        assertEquals(1, answer.getVersion());
        assertEquals(tutor, answer.getTutor());
        assertEquals(question, answer.getQuestion());
        assertEquals(Status.PUBLICADA, question.getStatus());
        assertEquals(answer, question.getCurrentAnswer());
        assertEquals(tutor, question.getTutor());
        assertNotNull(answer.getThreadMessage());
        verify(emailService).sendStudentTutorReplyEmail(
                eq("student@example.com"),
                eq("Laura Tutor"),
                eq("Q1"),
                any(),
                eq(40L),
                isNull());
    }

    @Test
    void shouldCreateCorrectionWithIncrementedVersion() {
        User tutorUser = User.builder().id(400L).role(UserRole.TUTOR).name("Mario Tutor").email("tutor@example.com").build();
        User studentUser = User.builder().id(401L).role(UserRole.ESTUDIANTE).name("Alumna").email("student@example.com").build();
        Tutor tutor = Tutor.builder().id(31L).user(tutorUser).build();
        Answer previous = Answer.builder().id(100L).version(2).build();
        Question question = Question.builder()
                .id(41L)
                .status(Status.PUBLICADA)
                .currentAnswer(previous)
                .student(Student.builder().id(51L).user(studentUser).build())
                .tutor(tutor)
                .title("Q2")
                .build();

        when(tutors.findByUser_Id(101L)).thenReturn(Optional.of(tutor));
        when(questions.findById(41L)).thenReturn(Optional.of(question));
        when(questionMessages.save(any(QuestionMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(answers.save(any(Answer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(questions.save(any(Question.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Answer answer = service.publishOrCorrect(101L, 41L, "Correccion", true);

        assertEquals(3, answer.getVersion());
        assertEquals(Status.CORREGIDA, question.getStatus());
        assertEquals(answer, question.getCurrentAnswer());
        verify(emailService).sendStudentTutorReplyEmail(
                eq("student@example.com"),
                eq("Mario Tutor"),
                eq("Q2"),
                any(),
                eq(41L),
                isNull());
    }

    @Test
    void shouldRejectPublishOrCorrectWhenBodyIsEmpty() {
        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.publishOrCorrect(99L, 40L, "   ", false));

        assertEquals("El mensaje no puede estar vacío", error.getMessage());
        verifyNoInteractions(tutors, questions, answers);
    }

    @Test
    void shouldRejectPublishOrCorrectWhenQuestionWasRejected() {
        Tutor tutor = Tutor.builder().id(30L).build();
        Question question = Question.builder()
                .id(45L)
                .status(Status.RECHAZADA)
                .tutor(tutor)
                .student(Student.builder().id(55L).build())
                .build();

        when(tutors.findByUser_Id(99L)).thenReturn(Optional.of(tutor));
        when(questions.findById(45L)).thenReturn(Optional.of(question));

        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> service.publishOrCorrect(99L, 45L, "Respuesta", false));

        assertEquals("Pregunta rechazada", error.getMessage());
        verify(answers, never()).save(any());
    }

    @Test
    void shouldRejectPendingQuestionAndClearCurrentAnswer() {
        Tutor tutor = Tutor.builder().id(32L).build();
        Question question = Question.builder()
                .id(42L)
                .status(Status.PENDIENTE)
                .tutor(tutor)
                .student(Student.builder().id(62L).build())
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
    void shouldNotAllowRejectingQuestionThatWasAlreadyAnswered() {
        Tutor tutor = Tutor.builder().id(32L).build();
        Question question = Question.builder()
                .id(46L)
                .status(Status.PUBLICADA)
                .tutor(tutor)
                .student(Student.builder().id(62L).build())
                .build();

        when(tutors.findByUser_Id(102L)).thenReturn(Optional.of(tutor));
        when(questions.findById(46L)).thenReturn(Optional.of(question));

        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> service.reject(102L, 46L, "Ya respondida"));

        assertEquals("No puedes rechazar una pregunta respondida", error.getMessage());
        verify(questions, never()).save(any());
    }

    @Test
    void shouldRejectCorrectionWhenQuestionHasNoPreviousAnswer() {
        Tutor tutor = Tutor.builder().id(33L).build();
        Question question = Question.builder()
                .id(43L)
                .status(Status.PENDIENTE)
                .tutor(tutor)
                .student(Student.builder().id(63L).build())
                .build();

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
        Question question = Question.builder()
                .id(44L)
                .scope(Scope.GENERAL)
                .status(Status.PENDIENTE)
                .student(Student.builder().id(61L).build())
                .tutor(tutor)
                .build();

        when(tutors.findByUser_Id(104L)).thenReturn(Optional.of(tutor));
        when(questions.findById(44L)).thenReturn(Optional.of(question));

        service.reclassify(104L, 44L, Scope.PLAN);

        assertEquals(Scope.PLAN, question.getScope());
        verify(questions).save(question);
    }

    @Test
    void shouldAddStudentFollowUpMessageAndNotifyTutor() {
        User studentUser = User.builder().id(500L).role(UserRole.ESTUDIANTE).name("Pedro Lopez").email("student@example.com").build();
        User tutorUser = User.builder().id(501L).role(UserRole.TUTOR).name("Tutor Uno").email("tutor@example.com").build();
        Student student = Student.builder().id(70L).user(studentUser).build();
        Tutor tutor = Tutor.builder().id(71L).user(tutorUser).build();
        Question question = Question.builder()
                .id(80L)
                .student(student)
                .tutor(tutor)
                .title("Seguimiento")
                .status(Status.PUBLICADA)
                .build();

        when(users.findById(500L)).thenReturn(Optional.of(studentUser));
        when(questions.findById(80L)).thenReturn(Optional.of(question));
        when(questionMessages.save(any(QuestionMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var created = service.addConversationMessage(500L, 80L, "Tengo otra duda", null);

        assertEquals("Pedro Lopez", created.authorName());
        assertEquals("ESTUDIANTE", created.authorRole());
        verify(emailService).sendTutorStudentFollowUpEmail(
                eq("tutor@example.com"),
                eq("Pedro Lopez"),
                eq("Seguimiento"),
                any(),
                eq(80L),
                isNull());
    }

    @Test
    void shouldRejectAddingConversationMessageToRejectedQuestion() {
        User studentUser = User.builder().id(500L).role(UserRole.ESTUDIANTE).name("Pedro").build();
        Question question = Question.builder()
                .id(81L)
                .student(Student.builder().id(70L).user(studentUser).build())
                .status(Status.RECHAZADA)
                .build();
        when(users.findById(500L)).thenReturn(Optional.of(studentUser));
        when(questions.findById(81L)).thenReturn(Optional.of(question));

        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> service.addConversationMessage(500L, 81L, "Seguimiento", null));

        assertEquals("No se pueden agregar mensajes a una pregunta rechazada", error.getMessage());
    }

    @Test
    void shouldRejectConversationMessageFromUnsupportedRole() {
        User adminUser = User.builder().id(600L).role(UserRole.ADMIN).name("Admin").build();
        Question question = Question.builder()
                .id(82L)
                .student(Student.builder().id(72L).user(User.builder().id(601L).role(UserRole.ESTUDIANTE).build()).build())
                .status(Status.PUBLICADA)
                .build();
        when(users.findById(600L)).thenReturn(Optional.of(adminUser));
        when(questions.findById(82L)).thenReturn(Optional.of(question));

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.addConversationMessage(600L, 82L, "Mensaje", null));

        assertEquals("Solo estudiantes o tutores pueden enviar mensajes", error.getMessage());
    }

    @Test
    void shouldCreateInitialAnswerWhenTutorAddsConversationMessageWithoutCurrentAnswer() {
        User tutorUser = User.builder().id(700L).role(UserRole.TUTOR).name("Tutor Uno").email("tutor@example.com").build();
        User studentUser = User.builder().id(701L).role(UserRole.ESTUDIANTE).name("Alumna Uno").email("student@example.com").build();
        Tutor tutor = Tutor.builder().id(73L).user(tutorUser).build();
        Student student = Student.builder().id(74L).user(studentUser).build();
        Question question = Question.builder()
                .id(83L)
                .student(student)
                .tutor(tutor)
                .title("Nueva respuesta")
                .status(Status.PENDIENTE)
                .build();

        when(users.findById(700L)).thenReturn(Optional.of(tutorUser));
        when(tutors.findByUser_Id(700L)).thenReturn(Optional.of(tutor));
        when(questions.findById(83L)).thenReturn(Optional.of(question));
        when(questionMessages.save(any(QuestionMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(answers.save(any(Answer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(questions.save(any(Question.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var created = service.addConversationMessage(700L, 83L, "Respuesta inicial", null);

        assertEquals("Tutor Uno", created.authorName());
        assertEquals(Status.PUBLICADA, question.getStatus());
        assertNotNull(question.getCurrentAnswer());
        assertEquals(1, question.getCurrentAnswer().getVersion());
        verify(answers).save(any(Answer.class));
        verify(emailService).sendStudentTutorReplyEmail(
                eq("student@example.com"),
                eq("Tutor Uno"),
                eq("Nueva respuesta"),
                any(),
                eq(83L),
                isNull());
    }

    @Test
    void shouldRejectStudentAccessToForeignQuestionConversation() {
        User studentUser = User.builder().id(800L).role(UserRole.ESTUDIANTE).name("Pedro").build();
        User ownerUser = User.builder().id(801L).role(UserRole.ESTUDIANTE).name("Maria").build();
        Question question = Question.builder()
                .id(84L)
                .student(Student.builder().id(75L).user(ownerUser).build())
                .status(Status.PUBLICADA)
                .build();

        when(users.findById(800L)).thenReturn(Optional.of(studentUser));
        when(questions.findById(84L)).thenReturn(Optional.of(question));

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.addConversationMessage(800L, 84L, "No me pertenece", null));

        assertEquals("No tienes permiso para ver esta pregunta", error.getMessage());
    }
}
