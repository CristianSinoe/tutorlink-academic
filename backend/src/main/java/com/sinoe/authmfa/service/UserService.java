package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.domain.user.UserRole;
import com.sinoe.authmfa.domain.user.UserStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository users;

    public Optional<User> findByEmail(String email) {
        if (email == null)
            return Optional.empty();
        return users.findByEmail(email.toLowerCase());
    }

    public boolean existsByEmail(String email) {
        return email != null && users.existsByEmail(email.toLowerCase());
    }

    public User createUser(
            String name,
            String lastNamePaterno,
            String lastNameMaterno, // puede ser null
            String email,
            String rawPassword,
            UserRole role,
            String career,          
            String plan,          
            Integer semester,      
            LocalDate birthDate,    
            String phone) {  
        String hash = BCrypt.hashpw(rawPassword, BCrypt.gensalt());
        User u = User.builder()
                .name(name)
                .lastNamePaterno(emptyToNull(lastNamePaterno))
                .lastNameMaterno(emptyToNull(lastNameMaterno))
                .email(email.toLowerCase())
                .passwordHash(hash)
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();
        return users.save(u);
    }

    public User createUser(
            String name,
            String lastName,
            String email,
            String rawPassword,
            UserRole role,
            String career,
            String plan,
            Integer semester,
            LocalDate birthDate,
            String phone) {
        return createUser(
                name,
                lastName,
                null,
                email,
                rawPassword,
                role,
                career,
                plan,
                semester,
                birthDate,
                phone
        );
    }

    public boolean checkPassword(User u, String rawPassword) {
        return u != null && BCrypt.checkpw(rawPassword, u.getPasswordHash());
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
}
