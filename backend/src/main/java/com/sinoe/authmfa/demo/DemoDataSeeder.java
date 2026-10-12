package com.sinoe.authmfa.demo;

import com.sinoe.authmfa.domain.qa.*;
import com.sinoe.authmfa.domain.user.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Profile("demo")
@RequiredArgsConstructor
public class DemoDataSeeder {
    private final EntityManager em;
    private final PasswordEncoder encoder;
    @Value("${tutorlink.demo.tutors:20}") private int tutorCount;
    @Value("${tutorlink.demo.students:300}") private int studentCount;
    @Value("${tutorlink.demo.password:TutorLinkDemo2026!}") private String password;

    @Transactional
    public void seed() {
        if (tutorCount < 1 || tutorCount > 100 || studentCount < 1 || studentCount > 2000) {
            throw new IllegalArgumentException("Demo admite 1–100 tutores y 1–2000 estudiantes");
        }
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String hash = encoder.encode(password);
        List<Tutor> tutors = new ArrayList<>();
        String[] departments = {"Matemáticas", "Sistemas", "Ciencias Económico-Administrativas", "Idiomas"};
        String[] specialties = {"Orientación académica", "Programación", "Estadística", "Gestión de proyectos", "Comunicación académica"};
        for (int i = 1; i <= tutorCount; i++) {
            User user = user("Tutor Demo " + i, "tutor", i, suffix, hash, UserRole.TUTOR, statusFor(i));
            Tutor tutor = Tutor.builder().user(user).tutorCode("DEMO-T-" + suffix + "-" + i)
                    .department(departments[(i - 1) % departments.length])
                    .specialty(specialties[(i - 1) % specialties.length])
                    .bio("Perfil sintético para demostración.").build();
            em.persist(tutor);
            tutors.add(tutor);
        }
        String[] careers = {"ISC", "ITI", "Administración", "Gestión Empresarial", "Mecatrónica"};
        String[] topics = {"Organización del semestre", "Inscripción de materias", "Servicio social",
                "Preparación de exámenes", "Proyecto de titulación"};
        for (int i = 1; i <= studentCount; i++) {
            User user = user("Estudiante Demo " + i, "estudiante", i, suffix, hash, UserRole.ESTUDIANTE, statusFor(i + tutorCount));
            Student student = Student.builder().user(user).matricula("DEMO-S-" + suffix + "-" + i)
                    .career(careers[(i - 1) % careers.length]).plan(i % 2 == 0 ? "2024" : "2020")
                    .semester(1 + (i - 1) % 9).build();
            em.persist(student);
            Tutor tutor = tutors.get((i - 1) % tutors.size());
            boolean assigned = i % 5 != 0;
            if (assigned) em.persist(TutorStudent.builder().student(student).tutor(tutor).build());
            Status status = Status.values()[(i - 1) % Status.values().length];
            Question question = Question.builder().student(student).tutor(tutor)
                    .scope(Scope.values()[(i - 1) % Scope.values().length])
                    .title("[Demo] " + topics[(i - 1) % topics.length])
                    .body("Consulta sintética: ¿qué pasos debo seguir para organizar esta actividad?")
                    .status(status).build();
            if (status == Status.RECHAZADA) question.setRejectReason("Ejemplo demo: consulta duplicada.");
            em.persist(question);
            message(question, user, question.getBody());
            if (status == Status.PUBLICADA || status == Status.CORREGIDA) {
                question.setCurrentAnswer(answer(question, tutor,
                        "Respuesta demo: revisa el calendario y prepara tus documentos.", 1));
                if (status == Status.CORREGIDA) {
                    question.setCurrentAnswer(answer(question, tutor,
                            "Corrección demo: confirma también las fechas con tu coordinación.", 2));
                }
            }
        }
        em.flush();
    }

    private User user(String name, String prefix, int number, String suffix, String hash, UserRole role, UserStatus status) {
        User user = User.builder().name(name).lastNamePaterno("Sintético").lastNameMaterno("TutorLink")
                .email(prefix + number + "." + suffix + "@example.invalid")
                .passwordHash(hash).role(role).status(status).build();
        em.persist(user);
        return user;
    }

    private UserStatus statusFor(int index) {
        if (index % 17 == 0) return UserStatus.BLOCKED;
        if (index % 11 == 0) return UserStatus.DISABLED;
        if (index % 7 == 0) return UserStatus.CREATED_BY_ADMIN;
        return UserStatus.ACTIVE;
    }

    private QuestionMessage message(Question question, User user, String body) {
        QuestionMessage message = QuestionMessage.builder().question(question).senderUser(user)
                .senderRole(user.getRole()).messageType(QuestionMessageType.TEXT).body(body).visible(true).build();
        em.persist(message);
        return message;
    }

    private Answer answer(Question question, Tutor tutor, String body, int version) {
        Answer answer = Answer.builder().question(question).tutor(tutor).body(body).version(version)
                .threadMessage(message(question, tutor.getUser(), body)).build();
        em.persist(answer);
        return answer;
    }
}
