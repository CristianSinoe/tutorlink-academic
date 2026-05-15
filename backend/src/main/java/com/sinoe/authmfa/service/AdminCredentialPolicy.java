package com.sinoe.authmfa.service;

import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class AdminCredentialPolicy {

    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern DIGIT = Pattern.compile("\\d");
    private static final Pattern SYMBOL = Pattern.compile("[^A-Za-z0-9]");

    public String normalizeEmail(String email) {
        if (email == null) {
            throw new IllegalArgumentException("El correo es obligatorio.");
        }
        String normalized = email.trim().toLowerCase();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("El correo es obligatorio.");
        }
        validateEmail(normalized);
        return normalized;
    }

    public String normalizeDisplayName(String displayName) {
        if (displayName == null) {
            throw new IllegalArgumentException("El nombre es obligatorio.");
        }
        String normalized = displayName.trim().replaceAll("\\s+", " ");
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("El nombre es obligatorio.");
        }
        if (normalized.length() > 120) {
            throw new IllegalArgumentException("El nombre no puede exceder 120 caracteres.");
        }
        return normalized;
    }

    public void validatePassword(String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("La contraseña es obligatoria.");
        }
        if (password.length() < 8) {
            throw new IllegalArgumentException(
                    "La contraseña debe tener al menos 8 caracteres e incluir mayúscula, minúscula, número y símbolo.");
        }
        if (!UPPERCASE.matcher(password).find()
                || !LOWERCASE.matcher(password).find()
                || !DIGIT.matcher(password).find()
                || !SYMBOL.matcher(password).find()) {
            throw new IllegalArgumentException(
                    "La contraseña debe incluir mayúscula, minúscula, número y símbolo.");
        }
    }

    private void validateEmail(String email) {
        try {
            InternetAddress address = new InternetAddress(email);
            address.validate();
        } catch (AddressException ex) {
            throw new IllegalArgumentException("El correo no tiene un formato válido.");
        }
    }
}
