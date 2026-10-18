package com.sinoe.authmfa.demo;

import com.sinoe.authmfa.domain.qa.*;
import com.sinoe.authmfa.domain.user.*;
import com.sinoe.authmfa.domain.institution.*;
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
@Profile("demo | demo-snapshot")
@RequiredArgsConstructor
public class DemoDataSeeder {
    private final EntityManager em;
    private final PasswordEncoder encoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;
    @Value("${tutorlink.demo.tutors:20}") private int tutorCount;
    @Value("${tutorlink.demo.students:300}") private int studentCount;
    @Value("${tutorlink.demo.password:TutorLinkDemo2026!}") private String password;

    @Transactional
    public void seed() {
        if (tutorCount < 1 || tutorCount > 100 || studentCount < 1 || studentCount > 2000) {
            throw new IllegalArgumentException("Demo admite 1–100 tutores y 1–2000 estudiantes");
        }
        DemoAcademicSchema.ensure(jdbc);
        Long present=em.createQuery("select count(i) from Institution i where i.code like 'DEMO15-I%'",Long.class).getSingleResult();
        if(present==3) return;
        if(present!=0) throw new IllegalStateException("El espacio reservado demo está ocupado; no se sobrescribirán datos");
        String suffix = "demo15";
        String hash = encoder.encode(password);
        List<Institution> schools=new ArrayList<>();
        for(int n=1;n<=3;n++) {var school=Institution.builder().code("DEMO15-I"+n).name("[Demo] Instituto ficticio "+n).build();em.persist(school);schools.add(school);}
        Institution institution=schools.get(0);
        List<Tutor> tutors = new ArrayList<>();
        String[] departments = {"Matemáticas", "Sistemas", "Ciencias Económico-Administrativas", "Idiomas"};
        String[] specialties = {"Orientación académica", "Programación", "Estadística", "Gestión de proyectos", "Comunicación académica"};
        for (int i = 1; i <= tutorCount; i++) {
            institution=schools.get((i-1)%3);
            User user = user("Tutor Demo " + i, "tutor", i, suffix, hash, UserRole.TUTOR, statusFor(i));
            Tutor tutor = Tutor.builder().user(user).tutorCode("DEMO-T-" + suffix + "-" + i)
                    .institution(institution)
                    .department(departments[(i - 1) % departments.length])
                    .specialty(specialties[(i - 1) % specialties.length])
                    .bio("Perfil sintético para demostración.").build();
            em.persist(tutor);
            em.persist(InstitutionMembership.builder().institution(institution).user(user).role(InstitutionRole.TUTOR).build());
            tutors.add(tutor);
        }
        String[] careers = {"ISC", "ITI", "Administración", "Gestión Empresarial", "Mecatrónica"};
        String[] topics = {"Organización del semestre", "Inscripción de materias", "Servicio social",
                "Preparación de exámenes", "Proyecto de titulación"};
        for (int i = 1; i <= studentCount; i++) {
            institution=schools.get((i-1)%3);
            User user = user("Estudiante Demo " + i, "estudiante", i, suffix, hash, UserRole.ESTUDIANTE, statusFor(i + tutorCount));
            Student student = Student.builder().user(user).matricula("DEMO-S-" + suffix + "-" + i)
                    .institution(institution)
                    .career(careers[(i - 1) % careers.length]).plan(i % 2 == 0 ? "2024" : "2020")
                    .semester(1 + (i - 1) % 9).build();
            em.persist(student);
            em.persist(InstitutionMembership.builder().institution(institution).user(user).role(InstitutionRole.ESTUDIANTE).build());
            final Institution selected=institution;
            List<Tutor> local=tutors.stream().filter(t -> t.getInstitution().getId().equals(selected.getId())).toList();
            if(local.isEmpty()) continue;
            Tutor tutor = local.get((i - 1) % local.size());
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
        academic(schools,tutors,hash,suffix);
        em.flush();
    }

    private void academic(List<Institution> schools,List<Tutor> tutors,String hash,String suffix) {
        java.time.Instant anchor=java.time.Instant.parse("2026-10-12T12:00:00Z");
        var active=em.createQuery("select s from Student s where s.institution.id=:i and s.user.status=:status order by s.id",Student.class)
                .setParameter("i",schools.get(0).getId()).setParameter("status",UserStatus.ACTIVE).setMaxResults(1).getResultList();
        Student first=active.isEmpty() ? em.createQuery("select s from Student s where s.institution.id=:i order by s.id",Student.class).setParameter("i",schools.get(0).getId()).setMaxResults(1).getSingleResult() : active.get(0);
        Student shared=Student.builder().institution(schools.get(1)).user(first.getUser()).matricula("DEMO-CROSS-S").career("Segunda institución").plan("2026").semester(2).build();
        em.persist(shared);em.persist(InstitutionMembership.builder().institution(schools.get(1)).user(first.getUser()).role(InstitutionRole.ESTUDIANTE).build());
        User sharedTeacher=tutors.get(0).getUser();
        Tutor sharedTutor=Tutor.builder().institution(schools.get(1)).user(sharedTeacher).tutorCode("DEMO-CROSS-T").department("Otra escuela").specialty("Tutoría independiente").build();
        em.persist(sharedTutor);em.persist(InstitutionMembership.builder().institution(schools.get(1)).user(sharedTeacher).role(InstitutionRole.TUTOR).build());
        em.persist(TutorStudent.builder().student(shared).tutor(sharedTutor).build());
        em.flush();
        User multiInstitutionAdministrator = null;
        for(int index=0;index<schools.size();index++) {
            Institution school=schools.get(index);
            User administrator=user("Admin Demo "+(index+1),"admin",index+1,suffix,hash,UserRole.ADMIN,UserStatus.ACTIVE);
            em.persist(InstitutionMembership.builder().institution(school).user(administrator).role(InstitutionRole.ADMIN).build());
            // admin1 is deliberately a member of two demo institutions so the
            // real E2E suite can exercise contextual switching without using
            // a production-like account. admin2 remains exclusive to school 2.
            if (index == 0) multiInstitutionAdministrator = administrator;
            if (index == 1) em.persist(InstitutionMembership.builder().institution(school)
                    .user(multiInstitutionAdministrator).role(InstitutionRole.ADMIN).build());
            var local=tutors.stream().filter(t -> t.getInstitution().getId().equals(school.getId())).limit(3).toList();
            List<com.sinoe.authmfa.domain.academic.Teacher> teachers=new ArrayList<>();
            for(int n=0;n<3;n++) {
                User teacherUser=n==2 && index>0 ? sharedTeacher : n<local.size() ? local.get(n).getUser() : user("Docente Demo "+(index+1)+"-"+n,"docente",index*3+n,suffix,hash,UserRole.DOCENTE,UserStatus.ACTIVE);
                var teacher=com.sinoe.authmfa.domain.academic.Teacher.builder().institution(school).user(teacherUser).teacherCode("DEMO-D-"+n).department("Área "+n).specialty("Materia sintética "+n).build();
                em.persist(teacher);teachers.add(teacher);
                em.persist(InstitutionMembership.builder().institution(school).user(teacherUser).role(InstitutionRole.DOCENTE).build());
            }
            em.flush();
            long period=academicInsert("insert into tl_academic_periods(institution_id,code,name,starts_on,ends_on) values(?,'DEMO-2026','Semestre demo',?,?)",school.getId(),java.time.LocalDate.of(2026,8,1),java.time.LocalDate.of(2026,12,20));
            for(int c=0;c<3;c++) {
                var teacher=teachers.get(c);
                long course=academicInsert("insert into tl_courses(institution_id,code,name,description) values(?,?,?,?)",school.getId(),"DEMO-C-"+c,new String[]{"Programación","Estadística","Comunicación"}[c],"Curso ficticio reproducible");
                long group=academicInsert("insert into tl_course_groups(institution_id,course_id,period_id,code,name) values(?,?,?,?,?)",school.getId(),course,period,"A","Grupo demo "+c);
                jdbc.update("insert into tl_course_group_teachers(group_id,teacher_id) values(?,?)",group,teacher.getId());
                jdbc.update("insert into tl_course_group_teachers(group_id,teacher_id) values(?,?)",group,teachers.get((c+1)%3).getId());
                academicInsert("insert into tl_course_contents(group_id,author_teacher_id,title,body,published,published_at) values(?,?,?,?,true,?)",group,teacher.getId(),"Guía demo "+c,"Material sintético de práctica",java.sql.Timestamp.from(anchor));
                long task=academicInsert("insert into tl_tasks(group_id,author_teacher_id,title,instructions,published,published_at,due_at,allow_late_submissions) values(?,?,?,?,true,?,?,true)",group,teacher.getId(),"Actividad demo "+c,"Ejercicio ficticio",java.sql.Timestamp.from(anchor.minusSeconds(86400)),java.sql.Timestamp.from(anchor.plusSeconds((c-3)*86400L)));
                academicInsert("insert into tl_tasks(group_id,author_teacher_id,title,instructions,published,published_at,due_at,allow_late_submissions) values(?,?,?,?,true,?,?,false)",group,teacher.getId(),"Actividad futura "+c,"Pendiente ficticio",java.sql.Timestamp.from(anchor),java.sql.Timestamp.from(anchor.plusSeconds((10+c)*86400L)));
                long session=academicInsert("insert into tl_class_sessions(group_id,teacher_id,starts_at,ends_at,topic) values(?,?,?,?,?)",group,teacher.getId(),java.sql.Timestamp.from(anchor.minusSeconds(86400)),java.sql.Timestamp.from(anchor.minusSeconds(82800)),"Clase demo "+c);
                var enrolled=em.createQuery("select s from Student s where s.institution.id=:i order by s.id",Student.class).setParameter("i",school.getId()).getResultList();
                for(int s=0;s<enrolled.size();s++) {
                    Student student=enrolled.get(s);
                    jdbc.update("insert into tl_course_enrollments(group_id,student_id,status) values(?,?,'ACTIVE')",group,student.getId());
                    int state=(s+c)%4;
                    if(state!=0) jdbc.update("insert into tl_task_submissions(task_id,student_id,body,status,submitted_at) values(?,?,?,?,?)",task,student.getId(),"Entrega ficticia "+s,
                            state==1 ? "DRAFT" : state==2 ? "ON_TIME" : "LATE",state==1 ? null : java.sql.Timestamp.from(anchor.plusSeconds((c-3)*86400L+(state==2 ? -3600 : 3600))));
                    jdbc.update("insert into tl_attendance_records(session_id,student_id,status) values(?,?,?)",session,student.getId(),new String[]{"PRESENT","ABSENT","LATE","EXCUSED"}[(s+c)%4]);
                    if(s%4==0) {
                        String status=new String[]{"OPEN","IN_PROGRESS","CLOSED"}[(s+c)%3];
                        long question=academicInsert("insert into tl_course_questions(group_id,student_id,target_teacher_id,responsible_teacher_id,subject,body,status,closed_at) values(?,?,?,?,?,?,?,?)",group,student.getId(),teacher.getId(),teacher.getId(),"Consulta demo "+s,"Duda sintética",status,status.equals("CLOSED") ? java.sql.Timestamp.from(anchor) : null);
                        jdbc.update("insert into tl_course_question_messages(question_id,author_user_id,body,is_primary_answer) values(?,?,?,?)",question,status.equals("OPEN") ? student.getUser().getId() : teacher.getUser().getId(),"Seguimiento ficticio",status.equals("CLOSED"));
                    }
                }
            }
        }
    }
    private long academicInsert(String sql,Object... args) {
        var keys=new org.springframework.jdbc.support.GeneratedKeyHolder();
        jdbc.update(connection -> {var statement=connection.prepareStatement(sql,new String[]{"id"});for(int i=0;i<args.length;i++) statement.setObject(i+1,args[i]);return statement;},keys);
        return java.util.Objects.requireNonNull(keys.getKey()).longValue();
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
