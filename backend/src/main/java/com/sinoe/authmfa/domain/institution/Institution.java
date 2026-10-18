package com.sinoe.authmfa.domain.institution;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "tl_institutions")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Institution {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true, length = 60) private String code;
    @Column(nullable = false, length = 180) private String name;
    @Column(nullable = false, length = 60) @Builder.Default private String timezone = "America/Mexico_City";
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16) @Builder.Default private InstitutionStatus status = InstitutionStatus.ACTIVE;
    @Column(name = "created_at", nullable = false, updatable = false) private OffsetDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private OffsetDateTime updatedAt;
    @PrePersist void created() { var now = OffsetDateTime.now(); if (createdAt == null) createdAt = now; updatedAt = now; }
    @PreUpdate void updated() { updatedAt = OffsetDateTime.now(); }
}
