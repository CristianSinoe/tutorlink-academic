package com.sinoe.authmfa.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AdminCredentialPolicyTest {

    private final AdminCredentialPolicy policy = new AdminCredentialPolicy();

    @Test
    void shouldNormalizeEmailToLowerCase() {
        assertEquals("admin.demo@example.com", policy.normalizeEmail(" Admin.Demo@Example.com "));
    }

    @Test
    void shouldRejectWeakPassword() {
        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> policy.validatePassword("solo1234"));

        assertEquals("La contraseña debe incluir mayúscula, minúscula, número y símbolo.", error.getMessage());
    }

    @Test
    void shouldAcceptStrongPassword() {
        policy.validatePassword("AdminDemo123!");
    }
}
