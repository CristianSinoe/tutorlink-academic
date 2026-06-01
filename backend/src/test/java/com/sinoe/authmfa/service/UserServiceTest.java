package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.domain.user.UserRole;
import com.sinoe.authmfa.domain.user.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository users;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService service;

    @BeforeEach
    void setUp() {
        service = new UserService(users, passwordEncoder);
    }

    @Test
    void shouldReturnEmptyWhenFindingByNullEmail() {
        assertTrue(service.findByEmail(null).isEmpty());
    }

    @Test
    void shouldNormalizeEmailWhenFindingByEmail() {
        User user = User.builder().email("demo@example.com").build();
        when(users.findByEmail("demo@example.com")).thenReturn(Optional.of(user));

        Optional<User> found = service.findByEmail("Demo@Example.com");

        assertTrue(found.isPresent());
        assertEquals(user, found.get());
    }

    @Test
    void shouldReturnFalseWhenCheckingExistenceWithNullEmail() {
        assertFalse(service.existsByEmail(null));
    }

    @Test
    void shouldNormalizeEmailWhenCheckingExistence() {
        when(users.existsByEmail("demo@example.com")).thenReturn(true);

        assertTrue(service.existsByEmail("Demo@Example.com"));
    }

    @Test
    void shouldCreateUserWithNormalizedEmailHashedPasswordAndActiveStatus() {
        UserService.CreateUserCommand command = new UserService.CreateUserCommand(
                "Ana",
                "Lopez",
                "   ",
                "Demo@Example.com",
                "Secret123!",
                UserRole.ADMIN);
        when(passwordEncoder.encode("Secret123!")).thenReturn("hashed");
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User created = service.createUser(command);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(users).save(captor.capture());
        User saved = captor.getValue();

        assertEquals("hashed", saved.getPasswordHash());
        assertEquals("demo@example.com", saved.getEmail());
        assertNull(saved.getLastNameMaterno());
        assertEquals(UserStatus.ACTIVE, saved.getStatus());
        assertEquals(UserRole.ADMIN, saved.getRole());
        assertEquals(created, saved);
    }

    @Test
    void shouldReturnFalseWhenCheckingPasswordForNullUser() {
        assertFalse(service.checkPassword(null, "Secret123!"));
    }

    @Test
    void shouldDelegatePasswordCheckToPasswordEncoder() {
        User user = User.builder().passwordHash("hashed").build();
        when(passwordEncoder.matches("Secret123!", "hashed")).thenReturn(true);

        boolean valid = service.checkPassword(user, "Secret123!");

        assertTrue(valid);
        verify(passwordEncoder).matches("Secret123!", "hashed");
    }

    @Test
    void shouldBuildExpectedJwtClaims() {
        User user = User.builder().id(7L).role(UserRole.TUTOR).build();

        Map<String, Object> claims = service.jwtClaims(user);

        assertEquals("TUTOR", claims.get("role"));
        assertEquals(7L, claims.get("uid"));
    }
}
