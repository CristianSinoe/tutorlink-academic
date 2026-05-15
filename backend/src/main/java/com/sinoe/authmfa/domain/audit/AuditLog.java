package com.sinoe.authmfa.domain.audit;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "tl_audit_log")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    @Column(nullable = false, length = 120)
    private String action;

    @Column(nullable = false)
    private boolean success;

    @Column(length = 80)
    private String errorCode;

    @Column(columnDefinition = "text")
    private String message;

    private String ip;
    @Column(name = "user_agent")
    private String userAgent;
    private String path;
    private String method;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    void pre() {
        createdAt = Instant.now();
    }
}
