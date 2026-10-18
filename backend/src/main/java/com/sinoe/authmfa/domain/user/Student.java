package com.sinoe.authmfa.domain.user;

import com.sinoe.authmfa.domain.institution.Institution;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tl_students", uniqueConstraints=@UniqueConstraint(columnNames={"institution_id","user_id"}))
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
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id")
    private Institution institution;

    @Column(nullable = false, length = 50)
    private String matricula;

    private String career;
    private String plan;
    private Integer semester;

    @Column(name = "birth_date")
    private java.time.LocalDate birthDate;

    @Column(name = "phone")
    private String phone;
}
