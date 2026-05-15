package com.sinoe.authmfa.domain.user;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tl_tutors")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tutor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación 1:1 con tl_users
    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(name = "tutor_code", nullable = false, unique = true, length = 50)
    private String tutorCode;

    private String department;
    private String specialty;

    @Column(name = "phone")
    private String phone;

    @Column(name = "bio")
    private String bio;

    @Column(name = "academic_link")
    private String academicLink;

    @Column(name = "professional_link")
    private String professionalLink;

    @Column(name = "notify_new_questions", nullable = false)
    private boolean notifyNewQuestions = false;

    @Column(name = "weekly_summary", nullable = false)
    private boolean weeklySummary = false;

    // getters/setters

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAcademicLink() {
        return academicLink;
    }

    public void setAcademicLink(String academicLink) {
        this.academicLink = academicLink;
    }

    public String getProfessionalLink() {
        return professionalLink;
    }

    public void setProfessionalLink(String professionalLink) {
        this.professionalLink = professionalLink;
    }

    public boolean isNotifyNewQuestions() {
        return notifyNewQuestions;
    }

    public void setNotifyNewQuestions(boolean notifyNewQuestions) {
        this.notifyNewQuestions = notifyNewQuestions;
    }

    public boolean isWeeklySummary() {
        return weeklySummary;
    }

    public void setWeeklySummary(boolean weeklySummary) {
        this.weeklySummary = weeklySummary;
    }


}
