package com.sinoe.authmfa.domain.qa;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sinoe.authmfa.domain.user.Tutor;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "tl_answers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id")
    @JsonIgnore
    private Question question;

    @ManyToOne(optional = false)
    @JoinColumn(name = "tutor_id")
    private Tutor tutor;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Column(nullable = false)
    private Integer version;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    void pre() {
        createdAt = Instant.now();
        if (version == null) version = 1;
    }
}
