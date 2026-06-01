package com.sinoe.authmfa.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sinoe.authmfa.domain.audit.AuditLog;
import com.sinoe.authmfa.domain.audit.AuditLogRepository;
import com.sinoe.authmfa.domain.otp.OtpCode;
import com.sinoe.authmfa.domain.otp.OtpRepository;
import com.sinoe.authmfa.domain.qa.Answer;
import com.sinoe.authmfa.domain.qa.AnswerRepository;
import com.sinoe.authmfa.domain.qa.Question;
import com.sinoe.authmfa.domain.qa.QuestionRepository;
import com.sinoe.authmfa.domain.qa.QuestionMessage;
import com.sinoe.authmfa.domain.qa.QuestionMessageRepository;
import com.sinoe.authmfa.domain.qa.QuestionMessageRevisionRepository;
import com.sinoe.authmfa.domain.qa.QuestionMessageType;
import com.sinoe.authmfa.domain.qa.Scope;
import com.sinoe.authmfa.domain.qa.Status;
import com.sinoe.authmfa.domain.user.Student;
import com.sinoe.authmfa.domain.user.StudentRepository;
import com.sinoe.authmfa.domain.user.Tutor;
import com.sinoe.authmfa.domain.user.TutorRepository;
import com.sinoe.authmfa.domain.user.TutorStudent;
import com.sinoe.authmfa.domain.user.TutorStudentRepository;
import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.domain.user.UserRole;
import com.sinoe.authmfa.domain.user.UserStatus;
import com.sinoe.authmfa.service.EmailService;
import com.sinoe.authmfa.service.JwtService;
import com.sinoe.authmfa.service.OtpService;
import com.sinoe.authmfa.service.RecaptchaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.Comparator;
import java.util.Map;

import static org.mockito.Mockito.reset;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
public abstract class AbstractIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("tutorlink_test")
            .withUsername("tutorlink")
            .withPassword("tutorlink");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected JwtService jwtService;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected StudentRepository studentRepository;

    @Autowired
    protected TutorRepository tutorRepository;

    @Autowired
    protected TutorStudentRepository tutorStudentRepository;

    @Autowired
    protected QuestionRepository questionRepository;

    @Autowired
    protected AnswerRepository answerRepository;

    @Autowired
    protected QuestionMessageRepository questionMessageRepository;

    @Autowired
    protected QuestionMessageRevisionRepository questionMessageRevisionRepository;

    @Autowired
    protected OtpRepository otpRepository;

    @Autowired
    protected OtpService otpService;

    @Autowired
    protected AuditLogRepository auditLogRepository;

    @MockBean
    protected RecaptchaService recaptchaService;

    @MockBean
    protected EmailService emailService;

    @org.junit.jupiter.api.BeforeEach
    void cleanDatabase() {
        jdbcTemplate.execute("""
                TRUNCATE TABLE
                  tl_audit_log,
                  otp_codes,
                  tl_question_message_revisions,
                  tl_answers,
                  tl_question_messages,
                  tl_questions,
                  tl_tutor_students,
                  tl_students,
                  tl_tutors,
                  tl_users
                RESTART IDENTITY CASCADE
                """);
        reset(recaptchaService, emailService);
    }

    protected User createUser(String email, UserRole role) {
        return createUser(email, role, UserStatus.ACTIVE, "Secret123!");
    }

    protected User createUser(String email, UserRole role, UserStatus status, String rawPassword) {
        User user = User.builder()
                .name(role.name() + "Name")
                .lastNamePaterno("Test")
                .lastNameMaterno("User")
                .email(email.toLowerCase())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(role)
                .status(status)
                .build();
        return userRepository.save(user);
    }

    protected Student createStudent(User user, String matricula) {
        return studentRepository.save(Student.builder()
                .user(user)
                .matricula(matricula)
                .career("ITI")
                .plan("2024")
                .semester(3)
                .phone("5550000000")
                .birthDate(java.time.LocalDate.now().minusYears(20))
                .build());
    }

    protected Tutor createTutor(User user, String tutorCode) {
        return tutorRepository.save(Tutor.builder()
                .user(user)
                .tutorCode(tutorCode)
                .department("Computacion")
                .specialty("Arquitectura")
                .phone("5551111111")
                .build());
    }

    protected TutorStudent createAssignment(Tutor tutor, Student student, User admin) {
        return tutorStudentRepository.save(TutorStudent.builder()
                .tutor(tutor)
                .student(student)
                .createdBy(admin)
                .build());
    }

    protected Question createQuestion(Student student, Tutor tutor, Scope scope, String title, String body, Status status) {
        Question question = questionRepository.save(Question.builder()
                .student(student)
                .tutor(tutor)
                .scope(scope)
                .title(title)
                .body(body)
                .status(status)
                .build());

        questionMessageRepository.save(QuestionMessage.builder()
                .question(question)
                .senderUser(student.getUser())
                .senderRole(student.getUser().getRole())
                .messageType(QuestionMessageType.TEXT)
                .body(body)
                .visible(true)
                .build());
        return question;
    }

    protected Answer createAnswer(Question question, Tutor tutor, String body, int version) {
        Answer answer = answerRepository.save(Answer.builder()
                .question(question)
                .tutor(tutor)
                .body(body)
                .version(version)
                .build());
        question.setCurrentAnswer(answer);
        question.setStatus(version > 1 ? Status.CORREGIDA : Status.PUBLICADA);
        questionRepository.save(question);
        return answer;
    }

    protected OtpCode createExpiredLoginOtp(User user, String code) {
        return otpRepository.save(OtpCode.builder()
                .userId(user.getId())
                .code(code)
                .publicId("expired-" + user.getId() + "-" + System.nanoTime())
                .purpose("LOGIN")
                .attempts(0)
                .createdAt(Instant.now().minusSeconds(600))
                .lastSentAt(Instant.now().minusSeconds(600))
                .expiresAt(Instant.now().minusSeconds(60))
                .consumed(false)
                .build());
    }

    protected String bearerToken(User user) {
        return "Bearer " + jwtService.generate(
                Map.of("role", user.getRole().name(), "uid", user.getId()),
                user.getEmail());
    }

    protected AuditLog latestAudit(String action) {
        return auditLogRepository.findAll().stream()
                .filter(log -> action.equals(log.getAction()))
                .max(Comparator.comparing(AuditLog::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElseThrow(() -> new AssertionError("No se encontró auditoría para action=" + action));
    }
}
