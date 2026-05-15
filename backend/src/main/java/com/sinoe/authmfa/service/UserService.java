package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.domain.user.UserRole;
import com.sinoe.authmfa.domain.user.UserStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public Optional<User> findByEmail(String email) {
        if (email == null)
            return Optional.empty();
        return users.findByEmail(email.toLowerCase());
    }

    public boolean existsByEmail(String email) {
        return email != null && users.existsByEmail(email.toLowerCase());
    }

    public User createUser(CreateUserCommand command) {
        String hash = passwordEncoder.encode(command.rawPassword());
        User user = User.builder()
                .name(command.name())
                .lastNamePaterno(emptyToNull(command.lastNamePaterno()))
                .lastNameMaterno(emptyToNull(command.lastNameMaterno()))
                .email(command.email().toLowerCase())
                .passwordHash(hash)
                .role(command.role())
                .status(UserStatus.ACTIVE)
                .build();
        return users.save(user);
    }

    public boolean checkPassword(User u, String rawPassword) {
        return u != null && passwordEncoder.matches(rawPassword, u.getPasswordHash());
    }

    public User save(User u) {
        return users.save(u);
    }

    public Map<String, Object> jwtClaims(User u) {
        return Map.of(
                "role", u.getRole().name(),
                "uid", u.getId()
        );
    }

    // helpers
    private static String emptyToNull(String s) {
        if (s == null)
            return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    public record CreateUserCommand(
            String name,
            String lastNamePaterno,
            String lastNameMaterno,
            String email,
            String rawPassword,
            UserRole role) {
    }
}
