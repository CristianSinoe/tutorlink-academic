package com.sinoe.authmfa.demo;

import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.domain.user.UserStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(showSql = false)
@ActiveProfiles("demo-snapshot")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({DemoConfiguration.class, DemoDataSeeder.class, DemoDataTest.PasswordConfig.class})
class DemoDataTest {
    @TestConfiguration
    static class PasswordConfig {
        @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
    }
    @Autowired jakarta.persistence.EntityManager em;
    @Autowired DemoDataSeeder seeder;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;

    @Test
    void seedsCompleteRelationshipsAndSupportsPostgresUserEnumOnH2() {
        seeder.seed();
        em.clear();
        assertThat(users.count()).isEqualTo(323);
        assertThat(jdbc.queryForObject("select count(*) from tl_institutions",Integer.class)).isEqualTo(3);
        assertThat(jdbc.queryForObject("select count(*) from tl_courses",Integer.class)).isEqualTo(9);
        assertThat(jdbc.queryForObject("select count(*) from tl_tasks",Integer.class)).isEqualTo(18);
        assertThat(jdbc.queryForObject("select count(distinct status) from tl_task_submissions",Integer.class)).isEqualTo(3);
        assertThat(jdbc.queryForObject("select count(distinct status) from tl_attendance_records",Integer.class)).isEqualTo(4);
        assertThat(jdbc.queryForObject("select count(*) from tl_course_enrollments e join tl_course_groups g on g.id=e.group_id join tl_students s on s.id=e.student_id where g.institution_id<>s.institution_id",Integer.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from tl_task_submissions s join tl_tasks t on t.id=s.task_id where (s.status='ON_TIME' and s.submitted_at>t.due_at) or (s.status='LATE' and s.submitted_at<=t.due_at)",Integer.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from tl_task_submissions where submitted_at>?",Integer.class,java.sql.Timestamp.from(java.time.Instant.parse("2026-10-12T12:00:00Z")))).isZero();
        long enrollments=jdbc.queryForObject("select count(*) from tl_course_enrollments",Long.class);
        seeder.seed();em.clear();
        assertThat(users.count()).isEqualTo(323);
        assertThat(jdbc.queryForObject("select count(*) from tl_course_enrollments",Long.class)).isEqualTo(enrollments);
        assertThat(users.findAll()).anyMatch(u -> u.getStatus() == UserStatus.ACTIVE)
                .anyMatch(u -> u.getStatus() == UserStatus.CREATED_BY_ADMIN)
                .anyMatch(u -> u.getStatus() == UserStatus.DISABLED)
                .anyMatch(u -> u.getStatus() == UserStatus.BLOCKED);
        assertThat(jdbc.queryForObject("select count(*) from tl_tutor_students", Integer.class)).isEqualTo(241);
        assertThat(jdbc.queryForObject("select count(distinct status) from tl_questions", Integer.class)).isEqualTo(4);
        assertThat(jdbc.queryForObject("select count(*) from tl_answers a join tl_question_messages m on a.thread_message_id=m.id", Integer.class)).isPositive();
        assertThat(jdbc.queryForObject("select count(*) from tl_questions where status in ('PUBLICADA','CORREGIDA') and current_answer_id is null", Integer.class)).isZero();
    }
}
