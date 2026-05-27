package com.sinoe.authmfa.integration;

import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRole;
import org.junit.jupiter.api.Test;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AccessControlIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldBlockStudentFromAdminEndpoint() throws Exception {
        User student = createUser("student.accessadmin@test.com", UserRole.ESTUDIANTE);

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", bearerToken(student)))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldBlockTutorFromStudentCreationEndpoint() throws Exception {
        User tutor = createUser("tutor.accessstudent@test.com", UserRole.TUTOR);

        mockMvc.perform(post("/api/student/questions")
                        .header("Authorization", bearerToken(tutor))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "scope": "GENERAL",
                                  "title": "Intento",
                                  "body": "Contenido suficiente para probar acceso",
                                  "recaptchaToken": "token"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldBlockAdminFromTutorEndpoint() throws Exception {
        User admin = createUser("admin.accesstutor@test.com", UserRole.ADMIN);

        mockMvc.perform(get("/api/tutor/questions/pending")
                        .header("Authorization", bearerToken(admin)))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldBlockRequestsWithoutTokenOnProtectedRoutes() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/student/questions/my"))
                .andExpect(status().isForbidden());
    }
}
