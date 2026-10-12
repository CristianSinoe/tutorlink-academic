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
@ActiveProfiles("demo")
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
        assertThat(users.count()).isEqualTo(320);
        assertThat(users.findAll()).anyMatch(u -> u.getStatus() == UserStatus.ACTIVE)
                .anyMatch(u -> u.getStatus() == UserStatus.CREATED_BY_ADMIN)
                .anyMatch(u -> u.getStatus() == UserStatus.DISABLED)
                .anyMatch(u -> u.getStatus() == UserStatus.BLOCKED);
        assertThat(jdbc.queryForObject("select count(*) from tl_tutor_students", Integer.class)).isEqualTo(240);
        assertThat(jdbc.queryForObject("select count(distinct status) from tl_questions", Integer.class)).isEqualTo(4);
        assertThat(jdbc.queryForObject("select count(*) from tl_answers a join tl_question_messages m on a.thread_message_id=m.id", Integer.class)).isPositive();
        assertThat(jdbc.queryForObject("select count(*) from tl_questions where status in ('PUBLICADA','CORREGIDA') and current_answer_id is null", Integer.class)).isZero();
    }
}
