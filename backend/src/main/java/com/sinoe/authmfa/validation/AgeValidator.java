package com.sinoe.authmfa.validation;

import java.time.LocalDate;
import java.time.Period;

public final class AgeValidator {
    private AgeValidator() {
    }

    public static boolean between15and120(LocalDate birth) {
        if (birth == null)
            return false;
        int years = Period.between(birth, LocalDate.now()).getYears();
        return years >= 15 && years <= 120;
    }
}
