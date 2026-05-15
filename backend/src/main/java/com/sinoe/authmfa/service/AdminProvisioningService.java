package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.domain.user.UserRole;
import com.sinoe.authmfa.domain.user.UserStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminProvisioningService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AdminCredentialPolicy credentialPolicy;

    @Transactional
    public SeedAdminResult seedActiveAdminIfMissing(String displayName, String email, String rawPassword) {
        String normalizedEmail = credentialPolicy.normalizeEmail(email);
        String normalizedName = credentialPolicy.normalizeDisplayName(displayName);
        credentialPolicy.validatePassword(rawPassword);

        return users.findByEmail(normalizedEmail)
                .map(existing -> new SeedAdminResult(existing, false))
                .orElseGet(() -> new SeedAdminResult(createActiveAdminInternal(normalizedName, normalizedEmail, rawPassword), true));
    }

    @Transactional
    public User createActiveAdmin(String displayName, String email, String rawPassword) {
        String normalizedEmail = credentialPolicy.normalizeEmail(email);
        String normalizedName = credentialPolicy.normalizeDisplayName(displayName);
        credentialPolicy.validatePassword(rawPassword);

        if (users.existsByEmail(normalizedEmail)) {
            throw new IllegalStateException("El correo ya está registrado: " + normalizedEmail);
        }

        return createActiveAdminInternal(normalizedName, normalizedEmail, rawPassword);
    }

    private User createActiveAdminInternal(String displayName, String normalizedEmail, String rawPassword) {
        NameParts nameParts = NameParts.fromDisplayName(displayName);
        User user = User.builder()
                .name(nameParts.name())
                .lastNamePaterno(nameParts.lastNamePaterno())
                .lastNameMaterno(nameParts.lastNameMaterno())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();
        return users.save(user);
    }

    public record SeedAdminResult(User user, boolean created) {
    }

    private record NameParts(String name, String lastNamePaterno, String lastNameMaterno) {

        private static NameParts fromDisplayName(String displayName) {
            List<String> parts = List.of(displayName.split(" "));
            if (parts.size() == 1) {
                return new NameParts(parts.get(0), "Administrador", null);
            }
            String name = parts.get(0);
            String lastNamePaterno = String.join(" ", parts.subList(1, parts.size()));
            return new NameParts(name, lastNamePaterno, null);
        }
    }
}
