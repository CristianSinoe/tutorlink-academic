package com.sinoe.authmfa.integration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import static org.junit.jupiter.api.Assertions.*;

@Testcontainers(disabledWithoutDocker=true)
class V30MigrationTest {
    @Container static final PostgreSQLContainer<?> POSTGRES=new PostgreSQLContainer<>("postgres:16-alpine");
    @Test void upgradesExistingProfilesWithoutChangingGlobalAccountsOrLegacyRelations() {
        var flyway=Flyway.configure().dataSource(POSTGRES.getJdbcUrl(),POSTGRES.getUsername(),POSTGRES.getPassword()).target("29").load();
        flyway.migrate();
        var jdbc=new JdbcTemplate(new DriverManagerDataSource(POSTGRES.getJdbcUrl(),POSTGRES.getUsername(),POSTGRES.getPassword()));
        long institution=jdbc.queryForObject("select id from tl_institutions where code='TUTORLINK_LEGACY'",Long.class);
        long studentUser=jdbc.queryForObject("insert into tl_users(name,last_name_paterno,email,password_hash,role,status) values('Historic','Student','historic.student@example.invalid','unused','ESTUDIANTE','ACTIVE') returning id",Long.class);
        long tutorUser=jdbc.queryForObject("insert into tl_users(name,last_name_paterno,email,password_hash,role,status) values('Historic','Tutor','historic.tutor@example.invalid','unused','TUTOR','ACTIVE') returning id",Long.class);
        long student=jdbc.queryForObject("insert into tl_students(user_id,institution_id,matricula) values(?,?,'HIST-S') returning id",Long.class,studentUser,institution);
        long tutor=jdbc.queryForObject("insert into tl_tutors(user_id,institution_id,tutor_code) values(?,?,'HIST-T') returning id",Long.class,tutorUser,institution);
        long assignment=jdbc.queryForObject("insert into tl_tutor_students(tutor_id,student_id) values(?,?) returning id",Long.class,tutor,student);
        long question=jdbc.queryForObject("insert into tl_questions(student_id,tutor_id,scope,title,body,status) values(?,?,'ACADEMICO','Historic','Preserved','PENDIENTE') returning id",Long.class,student,tutor);
        jdbc.update("insert into tl_institution_memberships(institution_id,user_id,role) values(?,?,'ESTUDIANTE')",institution,studentUser);
        var upgrade=Flyway.configure().dataSource(POSTGRES.getJdbcUrl(),POSTGRES.getUsername(),POSTGRES.getPassword()).load();
        upgrade.migrate();upgrade.validate();assertEquals(0,upgrade.migrate().migrationsExecuted);
        long second=jdbc.queryForObject("insert into tl_institutions(code,name) values('SECOND','Second') returning id",Long.class);
        jdbc.update("insert into tl_students(user_id,institution_id,matricula) values(?,?,'SECOND-S')",studentUser,second);
        jdbc.update("insert into tl_tutors(user_id,institution_id,tutor_code) values(?,?,'SECOND-T')",tutorUser,second);
        assertEquals(2,jdbc.queryForObject("select count(*) from tl_students where user_id=?",Integer.class,studentUser));
        assertEquals(2,jdbc.queryForObject("select count(*) from tl_tutors where user_id=?",Integer.class,tutorUser));
        assertEquals(student,jdbc.queryForObject("select student_id from tl_tutor_students where id=?",Long.class,assignment));
        assertEquals(tutor,jdbc.queryForObject("select tutor_id from tl_questions where id=?",Long.class,question));
        assertEquals("Preserved",jdbc.queryForObject("select body from tl_questions where id=?",String.class,question));
        jdbc.update("update tl_institution_memberships set status='SUSPENDED' where user_id=?",studentUser);
        assertEquals("ACTIVE",jdbc.queryForObject("select status::text from tl_users where id=?",String.class,studentUser));
    }
}
