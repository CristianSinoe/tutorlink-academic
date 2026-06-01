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
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TutorQuestionsIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldListGlobalPendingQuestionsForTutorEndpoint() throws Exception {
        User tutorUser = createUser("tutor.pending@test.com", UserRole.TUTOR);
        User tutorTwoUser = createUser("tutor.pending2@test.com", UserRole.TUTOR);
        Tutor tutorOne = createTutor(tutorUser, "T300");
        Tutor tutorTwo = createTutor(tutorTwoUser, "T301");
        User studentOneUser = createUser("student.pending1@test.com", UserRole.ESTUDIANTE);
        User studentTwoUser = createUser("student.pending2@test.com", UserRole.ESTUDIANTE);
        Student studentOne = createStudent(studentOneUser, "A300");
        Student studentTwo = createStudent(studentTwoUser, "A301");

        createQuestion(studentOne, tutorOne, Scope.GENERAL, "Pendiente 1", "Contenido 1 suficiente", Status.PENDIENTE);
        createQuestion(studentTwo, tutorTwo, Scope.PLAN, "Pendiente 2", "Contenido 2 suficiente", Status.PENDIENTE);

        mockMvc.perform(get("/api/tutor/questions/pending")
                        .header("Authorization", bearerToken(tutorUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void shouldAnswerAssignedQuestionAndPersistAudit() throws Exception {
        User tutorUser = createUser("tutor.answer@test.com", UserRole.TUTOR);
        Tutor tutor = createTutor(tutorUser, "T302");
        User studentUser = createUser("student.answer@test.com", UserRole.ESTUDIANTE);
        Student student = createStudent(studentUser, "A302");
        Question question = createQuestion(student, tutor, Scope.GENERAL, "Pregunta asignada", "Necesito una respuesta valida", Status.PENDIENTE);

        mockMvc.perform(post("/api/tutor/questions/{id}/answer", question.getId())
                        .header("Authorization", bearerToken(tutorUser))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "body": "Esta es una respuesta completa del tutor."
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", equalTo("PUBLICADA")));

        Question updated = questionRepository.findById(question.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(Status.PUBLICADA, updated.getStatus());
        org.junit.jupiter.api.Assertions.assertNotNull(updated.getCurrentAnswer());
        org.junit.jupiter.api.Assertions.assertEquals(1, answerRepository.findAll().size());

        AuditLog audit = latestAudit("ANSWER");
        org.junit.jupiter.api.Assertions.assertTrue(audit.isSuccess());
    }

    @Test
    void shouldRejectInvalidOrUnauthorizedTutorAnswer() throws Exception {
        User tutorUser = createUser("tutor.short@test.com", UserRole.TUTOR);
        Tutor tutor = createTutor(tutorUser, "T303");
        User studentUser = createUser("student.short@test.com", UserRole.ESTUDIANTE);
        Student student = createStudent(studentUser, "A303");
        Question question = createQuestion(student, tutor, Scope.GENERAL, "Pregunta corta", "Contenido suficiente", Status.PENDIENTE);

        mockMvc.perform(post("/api/tutor/questions/{id}/answer", question.getId())
                        .header("Authorization", bearerToken(tutorUser))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "body": "abc"
                                }
                                """))
                .andExpect(status().isBadRequest());

        User outsiderUser = createUser("tutor.outsider@test.com", UserRole.TUTOR);
        createTutor(outsiderUser, "T304");

        mockMvc.perform(post("/api/tutor/questions/{id}/answer", question.getId())
                        .header("Authorization", bearerToken(outsiderUser))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "body": "Intento sin asignacion"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", equalTo("No tienes permiso para responder esta pregunta")));
    }

    @Test
    void shouldRejectAndReclassifyQuestionWithAudit() throws Exception {
        User tutorUser = createUser("tutor.manage@test.com", UserRole.TUTOR);
        Tutor tutor = createTutor(tutorUser, "T305");
        User studentUser = createUser("student.manage@test.com", UserRole.ESTUDIANTE);
        Student student = createStudent(studentUser, "A305");
        Question question = createQuestion(student, tutor, Scope.GENERAL, "Gestion tutor", "Contenido gestionable", Status.PENDIENTE);

        mockMvc.perform(post("/api/tutor/questions/{id}/reject", question.getId())
                        .header("Authorization", bearerToken(tutorUser))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "reason": "Falta contexto suficiente"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", equalTo("REJECTED")));

        Question rejected = questionRepository.findById(question.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(Status.RECHAZADA, rejected.getStatus());
        org.junit.jupiter.api.Assertions.assertEquals("Falta contexto suficiente", rejected.getRejectReason());
        org.junit.jupiter.api.Assertions.assertTrue(latestAudit("REJECT").isSuccess());

        Question reclassifiable = createQuestion(student, tutor, Scope.GENERAL, "Reclasificar", "Contenido reclasificable", Status.PENDIENTE);

        mockMvc.perform(post("/api/tutor/questions/{id}/reclassify", reclassifiable.getId())
                        .header("Authorization", bearerToken(tutorUser))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "scope": "PLAN"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", equalTo("RECLASSIFIED")));

        Question updated = questionRepository.findById(reclassifiable.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(Scope.PLAN, updated.getScope());
        org.junit.jupiter.api.Assertions.assertTrue(latestAudit("RECLASSIFY").isSuccess());
    }
}
