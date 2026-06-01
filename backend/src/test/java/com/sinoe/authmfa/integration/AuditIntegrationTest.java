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

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuditIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldPersistAuditForFailedLogin() throws Exception {
        createUser("student.auditlogin@test.com", UserRole.ESTUDIANTE);
        when(recaptchaService.verify(anyString(), anyString())).thenReturn(true);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "student.auditlogin@test.com",
                                  "password": "wrong-pass",
                                  "recaptchaToken": "token-ok"
                                }
                                """))
                .andExpect(status().isUnauthorized());

        AuditLog audit = latestAudit("LOGIN");
        org.junit.jupiter.api.Assertions.assertFalse(audit.isSuccess());
    }

    @Test
    void shouldPersistAuditForSuccessfulQuestionCreation() throws Exception {
        User studentUser = createUser("student.auditsquestion@test.com", UserRole.ESTUDIANTE);
        createStudent(studentUser, "A500");
        when(recaptchaService.verify(anyString(), anyString())).thenReturn(true);

        mockMvc.perform(post("/api/student/questions")
                        .header("Authorization", bearerToken(studentUser))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "scope": "GENERAL",
                                  "title": "Auditoria pregunta",
                                  "body": "Contenido suficiente para auditar.",
                                  "recaptchaToken": "token-ok"
                                }
                                """))
                .andExpect(status().isCreated());

        AuditLog audit = latestAudit("CREATE_QUESTION");
        org.junit.jupiter.api.Assertions.assertTrue(audit.isSuccess());
    }

    @Test
    void shouldPersistAuditForTutorAnswer() throws Exception {
        User tutorUser = createUser("tutor.auditanswer@test.com", UserRole.TUTOR);
        Tutor tutor = createTutor(tutorUser, "T500");
        User studentUser = createUser("student.auditanswer@test.com", UserRole.ESTUDIANTE);
        Student student = createStudent(studentUser, "A501");
        Question question = createQuestion(student, tutor, Scope.GENERAL, "Auditoria respuesta", "Contenido auditable", Status.PENDIENTE);

        mockMvc.perform(post("/api/tutor/questions/{id}/answer", question.getId())
                        .header("Authorization", bearerToken(tutorUser))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "body": "Respuesta auditada del tutor."
                                }
                                """))
                .andExpect(status().isCreated());

        AuditLog audit = latestAudit("ANSWER");
        org.junit.jupiter.api.Assertions.assertTrue(audit.isSuccess());
    }
}
