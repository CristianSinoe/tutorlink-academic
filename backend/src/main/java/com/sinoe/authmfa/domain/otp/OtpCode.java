package com.sinoe.authmfa.domain.otp;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
    name = "otp_codes",
    indexes = {
        @Index(name = "idx_otp_user_id", columnList = "user_id"),
        @Index(name = "idx_otp_expires_at", columnList = "expires_at"),
        @Index(name = "idx_otp_public_id", columnList = "public_id", unique = true)
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 6)
    private String code;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "last_sent_at")
    private Instant lastSentAt;

    @Column(nullable = false, length = 30)
    private String purpose;

    @Column(name = "public_id", nullable = false, length = 100, unique = true)
    private String publicId;

    @Column(nullable = false)
    private boolean consumed;
}
