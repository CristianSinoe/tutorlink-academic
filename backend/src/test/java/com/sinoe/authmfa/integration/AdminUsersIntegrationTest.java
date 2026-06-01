package com.sinoe.authmfa.integration;

import com.sinoe.authmfa.domain.user.Student;
import com.sinoe.authmfa.domain.user.Tutor;
import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRole;
import com.sinoe.authmfa.domain.user.UserStatus;
import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminUsersIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldListUsersForAdminOnly() throws Exception {
        User admin = createUser("admin.users@test.com", UserRole.ADMIN);
        createUser("student.users@test.com", UserRole.ESTUDIANTE);

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", bearerToken(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void shouldChangeUserStatusAndPersistIt() throws Exception {
        User admin = createUser("admin.status@test.com", UserRole.ADMIN);
        User student = createUser("student.status@test.com", UserRole.ESTUDIANTE);

        mockMvc.perform(patch("/api/admin/users/{userId}/status", student.getId())
                        .header("Authorization", bearerToken(admin))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "role": "ESTUDIANTE",
                                  "status": "DISABLED"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", equalTo("Estado actualizado a DISABLED")));

        User updated = userRepository.findById(student.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(UserStatus.DISABLED, updated.getStatus());
    }

    @Test
    void shouldRejectInvalidStatusPayload() throws Exception {
        User admin = createUser("admin.invalidstatus@test.com", UserRole.ADMIN);
        User student = createUser("student.invalidstatus@test.com", UserRole.ESTUDIANTE);

        mockMvc.perform(patch("/api/admin/users/{userId}/status", student.getId())
                        .header("Authorization", bearerToken(admin))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "role": "ESTUDIANTE"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldAssignAndListTutorStudentRelations() throws Exception {
        User admin = createUser("admin.assignments@test.com", UserRole.ADMIN);
        User tutorUser = createUser("tutor.assignments@test.com", UserRole.TUTOR);
        Tutor tutor = createTutor(tutorUser, "T400");
        User studentUser = createUser("student.assignments@test.com", UserRole.ESTUDIANTE);
        Student student = createStudent(studentUser, "A400");

        mockMvc.perform(post("/api/admin/users/tutor-students/assign")
                        .header("Authorization", bearerToken(admin))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "tutorCode": "T400",
                                  "matricula": "A400"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", equalTo("Estudiante A400 asignado a tutor T400")));

        var assignment = tutorStudentRepository.findByStudent_Id(student.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(tutor.getId(), assignment.getTutor().getId());

        mockMvc.perform(get("/api/admin/users/tutor-students")
                        .header("Authorization", bearerToken(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].tutorCode", equalTo("T400")))
                .andExpect(jsonPath("$[0].studentMatricula", equalTo("A400")));
    }

    @Test
    void shouldRejectInvalidAssignmentPayload() throws Exception {
        User admin = createUser("admin.invalidassign@test.com", UserRole.ADMIN);

        mockMvc.perform(post("/api/admin/users/tutor-students/assign")
                        .header("Authorization", bearerToken(admin))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "tutorCode": ""
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}
