package com.sinoe.authmfa.domain.institution;

import com.sinoe.authmfa.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "tl_institution_memberships", uniqueConstraints = @UniqueConstraint(name = "uk_membership_institution_user_role", columnNames = {"institution_id", "user_id", "role"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class InstitutionMembership {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "institution_id") private Institution institution;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "user_id") private User user;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private InstitutionRole role;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16) @Builder.Default private MembershipStatus status = MembershipStatus.ACTIVE;
    @Column(name="contact_email",length=190) private String contactEmail;
    @Column(name="contact_verified_at") private OffsetDateTime contactVerifiedAt;
    @Column(name = "created_at", nullable = false, updatable = false) private OffsetDateTime createdAt;
    @PrePersist void created() { if (createdAt == null) createdAt = OffsetDateTime.now(); }
}
