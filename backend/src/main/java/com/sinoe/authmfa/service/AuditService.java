package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.audit.AuditLog;
import com.sinoe.authmfa.domain.audit.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditService {
    private final AuditLogRepository repo;

    public void log(HttpServletRequest req, Long userId, String action, boolean success, String errorCode,
            String message) {
        String ip = req.getHeader("X-Forwarded-For");
        if (ip == null)
            ip = req.getRemoteAddr();
        String ua = req.getHeader("User-Agent");
        repo.save(AuditLog.builder()
                .userId(userId)
                .action(action)
                .success(success)
                .errorCode(errorCode)
                .message(message)
                .ip(ip)
                .userAgent(ua)
                .path(req.getRequestURI())
                .method(req.getMethod())
                .build());
    }
}
