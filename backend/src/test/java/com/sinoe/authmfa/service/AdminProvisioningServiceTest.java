package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.domain.user.UserRole;
import com.sinoe.authmfa.domain.user.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminProvisioningServiceTest {

    @Mock
    private UserRepository users;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AdminProvisioningService service;

    @BeforeEach
    void setUp() {
        service = new AdminProvisioningService(users, passwordEncoder, new AdminCredentialPolicy());
    }

    @Test
    void shouldCreateActiveAdmin() {
        when(users.existsByEmail("admin.demo@example.com")).thenReturn(false);
        when(passwordEncoder.encode("AdminDemo123!")).thenReturn("hashed-value");
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User user = service.createActiveAdmin("Administrador Demo", "admin.demo@example.com", "AdminDemo123!");

        assertEquals("admin.demo@example.com", user.getEmail());
        assertEquals(UserRole.ADMIN, user.getRole());
        assertEquals(UserStatus.ACTIVE, user.getStatus());
        assertEquals("hashed-value", user.getPasswordHash());
    }

    @Test
    void shouldNotDuplicateSeededAdmin() {
        User existing = User.builder()
                .id(7L)
                .email("admin.demo@example.com")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();

        when(users.findByEmail("admin.demo@example.com")).thenReturn(Optional.of(existing));

        var result = service.seedActiveAdminIfMissing(
                "Administrador Demo",
                "admin.demo@example.com",
                "AdminDemo123!");

        assertFalse(result.created());
        assertEquals(existing, result.user());
    }
}
