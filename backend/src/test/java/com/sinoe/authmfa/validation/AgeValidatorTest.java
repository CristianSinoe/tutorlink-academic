package com.sinoe.authmfa.validation;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class AgeValidatorTest {

    @Test
    void shouldRejectNullBirthDate() {
        assertFalse(AgeValidator.between15and120(null));
    }

    @Test
    void shouldAcceptAgesInsideAllowedRange() {
        assertTrue(AgeValidator.between15and120(LocalDate.now().minusYears(15)));
        assertTrue(AgeValidator.between15and120(LocalDate.now().minusYears(30)));
        assertTrue(AgeValidator.between15and120(LocalDate.now().minusYears(120)));
    }

    @Test
    void shouldRejectAgesOutsideAllowedRange() {
        assertFalse(AgeValidator.between15and120(LocalDate.now().minusYears(14)));
        assertFalse(AgeValidator.between15and120(LocalDate.now().minusYears(121)));
    }
}
