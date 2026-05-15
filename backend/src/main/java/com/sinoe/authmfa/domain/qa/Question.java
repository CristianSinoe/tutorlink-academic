package com.sinoe.authmfa.domain.qa;

import com.sinoe.authmfa.domain.user.Student;
import com.sinoe.authmfa.domain.user.Tutor;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "tl_questions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Apunta a Student
    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id")
    private Student student;

    // Tutor asignado
    @ManyToOne
    @JoinColumn(name = "tutor_id")
    private Tutor tutor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Scope scope;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Status status;

    @Column(name = "reject_reason")
    private String rejectReason;

    @ManyToOne
    @JoinColumn(name = "current_answer_id")
    private Answer currentAnswer;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void pre() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
