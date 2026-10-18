package com.sinoe.authmfa.domain.academic;

import com.sinoe.authmfa.domain.institution.Institution;
import com.sinoe.authmfa.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tl_teachers", uniqueConstraints = { @UniqueConstraint(columnNames = {"institution_id", "user_id"}), @UniqueConstraint(columnNames = {"institution_id", "teacher_code"}) })
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Teacher {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "institution_id") private Institution institution;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "user_id") private User user;
    @Column(name = "teacher_code", nullable = false, length = 50) private String teacherCode;
    private String department;
    private String specialty;
    private String phone;
}
