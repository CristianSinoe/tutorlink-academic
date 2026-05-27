package com.sinoe.authmfa.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.sinoe.authmfa.domain.audit.AuditLog;
import com.sinoe.authmfa.domain.otp.OtpCode;
import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRole;
import com.sinoe.authmfa.domain.user.UserStatus;
import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldStartOtpLoginFlowWithValidCredentials() throws Exception {
        User user = createUser("student.login@test.com", UserRole.ESTUDIANTE);
        when(recaptchaService.verify(anyString(), anyString())).thenReturn(true);

        String body = """
                {
                  "email": "student.login@test.com",
                  "password": "Secret123!",
                  "recaptchaToken": "token-ok"
                }
                """;

        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requiresOtp").value(true))
                .andExpect(jsonPath("$.otpToken", notNullValue()))
                .andExpect(jsonPath("$.resendCooldownSeconds").value(30))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        OtpCode otp = otpRepository.findTopByUserIdAndPurposeOrderByCreatedAtDesc(user.getId(), "LOGIN").orElseThrow();

        org.junit.jupiter.api.Assertions.assertEquals(json.get("otpToken").asText(), otp.getPublicId());
        AuditLog audit = latestAudit("LOGIN_OTP_REQUEST");
        org.junit.jupiter.api.Assertions.assertTrue(audit.isSuccess());
    }

    @Test
    void shouldRejectLoginWithInvalidCredentials() throws Exception {
        createUser("student.invalid@test.com", UserRole.ESTUDIANTE);
        when(recaptchaService.verify(anyString(), anyString())).thenReturn(true);

        String body = """
                {
                  "email": "student.invalid@test.com",
                  "password": "wrong-pass",
                  "recaptchaToken": "token-ok"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", equalTo("Credenciales inválidas")));

        AuditLog audit = latestAudit("LOGIN");
        org.junit.jupiter.api.Assertions.assertFalse(audit.isSuccess());
    }

    @Test
    void shouldRejectLoginForDisabledOrBlockedUsers() throws Exception {
        createUser("disabled@test.com", UserRole.ESTUDIANTE, UserStatus.DISABLED, "Secret123!");
        createUser("blocked@test.com", UserRole.ESTUDIANTE, UserStatus.BLOCKED, "Secret123!");
        when(recaptchaService.verify(anyString(), anyString())).thenReturn(true);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "disabled@test.com",
                                  "password": "Secret123!",
                                  "recaptchaToken": "token-ok"
                                }
                                """))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "blocked@test.com",
                                  "password": "Secret123!",
                                  "recaptchaToken": "token-ok"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldRejectLoginWhenRecaptchaFails() throws Exception {
        createUser("student.recaptcha@test.com", UserRole.ESTUDIANTE);
        when(recaptchaService.verify(anyString(), anyString())).thenReturn(false);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "student.recaptcha@test.com",
                                  "password": "Secret123!",
                                  "recaptchaToken": "bad-token"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", equalTo("reCAPTCHA inválido")));

        AuditLog audit = latestAudit("LOGIN");
        org.junit.jupiter.api.Assertions.assertFalse(audit.isSuccess());
    }

    @Test
    void shouldVerifyOtpAndReturnJwt() throws Exception {
        User user = createUser("student.otp@test.com", UserRole.ESTUDIANTE);
        OtpCode otp = otpService.generateLoginOtpForUser(user.getId());

        mockMvc.perform(post("/api/auth/login/verify-otp")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "otpToken", otp.getPublicId(),
                                "code", otp.getCode()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.role", equalTo("ESTUDIANTE")))
                .andExpect(jsonPath("$.email", equalTo("student.otp@test.com")));

        AuditLog audit = latestAudit("LOGIN_OTP");
        org.junit.jupiter.api.Assertions.assertTrue(audit.isSuccess());
    }

    @Test
    void shouldRejectInvalidOrExpiredOtp() throws Exception {
        User invalidUser = createUser("student.invalidotp@test.com", UserRole.ESTUDIANTE);
        OtpCode validOtp = otpService.generateLoginOtpForUser(invalidUser.getId());
        User expiredUser = createUser("student.expiredotp@test.com", UserRole.ESTUDIANTE);
        OtpCode expiredOtp = createExpiredLoginOtp(expiredUser, "654321");

        mockMvc.perform(post("/api/auth/login/verify-otp")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "otpToken", validOtp.getPublicId(),
                                "code", "000000"
                        ))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login/verify-otp")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "otpToken", expiredOtp.getPublicId(),
                                "code", expiredOtp.getCode()
                        ))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldProtectMeEndpointAgainstMissingOrInvalidToken() throws Exception {
        mockMvc.perform(get("/api/me"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/me")
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturnCurrentUserProfileForStudentTutorAndAdmin() throws Exception {
        User studentUser = createUser("student.me@test.com", UserRole.ESTUDIANTE);
        createStudent(studentUser, "A100");
        User tutorUser = createUser("tutor.me@test.com", UserRole.TUTOR);
        createTutor(tutorUser, "T100");
        User adminUser = createUser("admin.me@test.com", UserRole.ADMIN);

        mockMvc.perform(get("/api/me")
                        .header("Authorization", bearerToken(studentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", equalTo("student.me@test.com")))
                .andExpect(jsonPath("$.role", equalTo("ESTUDIANTE")))
                .andExpect(jsonPath("$.matricula", equalTo("A100")));

        mockMvc.perform(get("/api/me")
                        .header("Authorization", bearerToken(tutorUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", equalTo("tutor.me@test.com")))
                .andExpect(jsonPath("$.role", equalTo("TUTOR")))
                .andExpect(jsonPath("$.tutorCode", equalTo("T100")));

        mockMvc.perform(get("/api/me")
                        .header("Authorization", bearerToken(adminUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", equalTo("admin.me@test.com")))
                .andExpect(jsonPath("$.role", equalTo("ADMIN")));
    }
}
