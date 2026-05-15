package com.sinoe.authmfa.domain.user;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tl_students")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación 1:1 con tl_users
    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(nullable = false, unique = true, length = 50)
    private String matricula;

    private String career;
    private String plan;
    private Integer semester;

    @Column(name = "birth_date")
    private java.time.LocalDate birthDate;

    @Column(name = "phone")
    private String phone;
}
