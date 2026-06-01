package com.sinoe.authmfa.integration;

import com.sinoe.authmfa.domain.audit.AuditLog;
import com.sinoe.authmfa.domain.qa.Question;
import com.sinoe.authmfa.domain.qa.Scope;
import com.sinoe.authmfa.domain.qa.Status;
import com.sinoe.authmfa.domain.user.Student;
import com.sinoe.authmfa.domain.user.Tutor;
import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRole;
import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class StudentQuestionsIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldCreateStudentQuestionAndPersistAudit() throws Exception {
        User admin = createUser("admin.assign@test.com", UserRole.ADMIN);
        User studentUser = createUser("student.question@test.com", UserRole.ESTUDIANTE);
        Student student = createStudent(studentUser, "A200");
        User tutorUser = createUser("tutor.assign@test.com", UserRole.TUTOR);
        Tutor tutor = createTutor(tutorUser, "T200");
        createAssignment(tutor, student, admin);
        when(recaptchaService.verify(anyString(), anyString())).thenReturn(true);

        mockMvc.perform(post("/api/student/questions")
                        .header("Authorization", bearerToken(studentUser))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "scope": "GENERAL",
                                  "title": "Duda de algebra",
                                  "body": "Necesito ayuda para entender matrices.",
                                  "recaptchaToken": "token-ok"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", equalTo("PENDIENTE")));

        Question saved = questionRepository.findAll().get(0);
        org.junit.jupiter.api.Assertions.assertEquals("Duda de algebra", saved.getTitle());
        org.junit.jupiter.api.Assertions.assertEquals(Status.PENDIENTE, saved.getStatus());
        org.junit.jupiter.api.Assertions.assertEquals(tutor.getId(), saved.getTutor().getId());

        AuditLog audit = latestAudit("CREATE_QUESTION");
        org.junit.jupiter.api.Assertions.assertTrue(audit.isSuccess());
    }

    @Test
    void shouldRejectStudentQuestionWithInvalidPayloadOrRecaptcha() throws Exception {
        User studentUser = createUser("student.invalidquestion@test.com", UserRole.ESTUDIANTE);
        createStudent(studentUser, "A201");
        when(recaptchaService.verify(anyString(), anyString())).thenReturn(true);

        mockMvc.perform(post("/api/student/questions")
                        .header("Authorization", bearerToken(studentUser))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "scope": "GENERAL",
                                  "title": "ABC",
                                  "body": "",
                                  "recaptchaToken": "token-ok"
                                }
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/student/questions")
                        .header("Authorization", bearerToken(studentUser))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Duda válida",
                                  "body": "Contenido con longitud suficiente",
                                  "recaptchaToken": "token-ok"
                                }
                                """))
                .andExpect(status().isBadRequest());

        when(recaptchaService.verify(anyString(), anyString())).thenReturn(false);

        mockMvc.perform(post("/api/student/questions")
                        .header("Authorization", bearerToken(studentUser))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "scope": "GENERAL",
                                  "title": "Duda válida",
                                  "body": "Contenido con longitud suficiente",
                                  "recaptchaToken": "token-bad"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", equalTo("reCAPTCHA inválido")));
    }

    @Test
    void shouldReturnOnlyOwnQuestionHistory() throws Exception {
        User studentUser = createUser("student.history@test.com", UserRole.ESTUDIANTE);
        Student student = createStudent(studentUser, "A202");
        User otherUser = createUser("student.other@test.com", UserRole.ESTUDIANTE);
        Student otherStudent = createStudent(otherUser, "A203");

        createQuestion(student, null, Scope.GENERAL, "Mi pregunta", "Contenido principal", Status.PENDIENTE);
        createQuestion(otherStudent, null, Scope.PLAN, "Ajena", "Contenido de otra persona", Status.PENDIENTE);

        mockMvc.perform(get("/api/student/questions/my")
                        .header("Authorization", bearerToken(studentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title", equalTo("Mi pregunta")));
    }

    @Test
    void shouldReturnOwnQuestionDetailAndRejectForeignAccess() throws Exception {
        User studentUser = createUser("student.detail@test.com", UserRole.ESTUDIANTE);
        Student student = createStudent(studentUser, "A204");
        User otherUser = createUser("student.foreign@test.com", UserRole.ESTUDIANTE);
        Student otherStudent = createStudent(otherUser, "A205");

        Question ownQuestion = createQuestion(student, null, Scope.GENERAL, "Detalle propio", "Contenido propio", Status.PENDIENTE);
        Question foreignQuestion = createQuestion(otherStudent, null, Scope.GENERAL, "Detalle ajeno", "Contenido ajeno", Status.PENDIENTE);

        mockMvc.perform(get("/api/student/questions/{id}", ownQuestion.getId())
                        .header("Authorization", bearerToken(studentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", equalTo(ownQuestion.getId().intValue())))
                .andExpect(jsonPath("$.title", equalTo("Detalle propio")));

        mockMvc.perform(get("/api/student/questions/{id}", foreignQuestion.getId())
                        .header("Authorization", bearerToken(studentUser)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnAnswerHistoryOnlyForQuestionOwner() throws Exception {
        User studentUser = createUser("student.answers@test.com", UserRole.ESTUDIANTE);
        Student student = createStudent(studentUser, "A206");
        User tutorUser = createUser("tutor.answers@test.com", UserRole.TUTOR);
        Tutor tutor = createTutor(tutorUser, "T206");
        User otherUser = createUser("student.notowner@test.com", UserRole.ESTUDIANTE);
        createStudent(otherUser, "A207");

        Question question = createQuestion(student, tutor, Scope.GENERAL, "Historia respuesta", "Contenido base", Status.PENDIENTE);
        createAnswer(question, tutor, "Respuesta inicial al estudiante", 1);

        mockMvc.perform(get("/api/student/questions/{id}/answers", question.getId())
                        .header("Authorization", bearerToken(studentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].body", equalTo("Respuesta inicial al estudiante")));

        mockMvc.perform(get("/api/student/questions/{id}/answers", question.getId())
                        .header("Authorization", bearerToken(otherUser)))
                .andExpect(status().isNotFound());
    }
}
