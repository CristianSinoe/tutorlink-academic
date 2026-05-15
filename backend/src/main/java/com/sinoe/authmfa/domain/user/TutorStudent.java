package com.sinoe.authmfa.domain.user;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "tl_tutor_students")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TutorStudent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Muchos estudiantes para un tutor (1:N)
    @ManyToOne(optional = false)
    @JoinColumn(name = "tutor_id")
    private Tutor tutor;

    // Un estudiante solo puede aparecer una vez
    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id", unique = true)
    private Student student;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    // Quién hizo la asignación (ADMIN)
    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
