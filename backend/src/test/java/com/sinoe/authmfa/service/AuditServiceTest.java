package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.audit.AuditLog;
import com.sinoe.authmfa.domain.audit.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditLogRepository repo;

    @Mock
    private HttpServletRequest request;

    private AuditService service;

    @BeforeEach
    void setUp() {
        service = new AuditService(repo);
        when(repo.save(any(AuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void shouldUseForwardedForHeaderWhenAvailable() {
        when(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.10");
        when(request.getHeader("User-Agent")).thenReturn("JUnit");
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(request.getMethod()).thenReturn("POST");

        service.log(request, 7L, "LOGIN", true, null, "ok");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(repo).save(captor.capture());
        AuditLog saved = captor.getValue();
        assertEquals(7L, saved.getUserId());
        assertEquals("LOGIN", saved.getAction());
        assertEquals(true, saved.isSuccess());
        assertEquals("203.0.113.10", saved.getIp());
        assertEquals("JUnit", saved.getUserAgent());
        assertEquals("/api/auth/login", saved.getPath());
        assertEquals("POST", saved.getMethod());
        assertEquals("ok", saved.getMessage());
    }

    @Test
    void shouldFallbackToRemoteAddressWhenForwardedForHeaderIsMissing() {
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(request.getHeader("User-Agent")).thenReturn("JUnit");
        when(request.getRequestURI()).thenReturn("/api/me");
        when(request.getMethod()).thenReturn("GET");

        service.log(request, null, "ME", false, "DENIED", "forbidden");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(repo).save(captor.capture());
        AuditLog saved = captor.getValue();
        assertEquals("127.0.0.1", saved.getIp());
        assertEquals("DENIED", saved.getErrorCode());
        assertEquals("forbidden", saved.getMessage());
        assertEquals("GET", saved.getMethod());
    }

    @Test
    void shouldPersistSystemAuditWithFixedPlaceholders() {
        service.logSystem(5L, "BOOTSTRAP_ADMIN_CREATE", true, null, "created");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(repo).save(captor.capture());
        AuditLog saved = captor.getValue();
        assertEquals(5L, saved.getUserId());
        assertEquals("BOOTSTRAP_ADMIN_CREATE", saved.getAction());
        assertEquals(true, saved.isSuccess());
        assertEquals("system", saved.getIp());
        assertEquals("system", saved.getUserAgent());
        assertEquals("system", saved.getPath());
        assertEquals("SYSTEM", saved.getMethod());
    }
}
