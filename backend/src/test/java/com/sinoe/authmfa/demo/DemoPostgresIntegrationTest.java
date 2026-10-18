package com.sinoe.authmfa.demo;

import com.sinoe.authmfa.domain.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import javax.sql.DataSource;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "security.jwt.secret=01234567890123456789012345678901",
        "recaptcha.site-key=test", "recaptcha.secret-key=test",
        "app.seed-admin.enabled=false", "admin.bootstrap.enabled=false",
        "tutorlink.mail.from=demo@example.invalid", "logging.level.root=WARN"
})
@ActiveProfiles("demo")
@Testcontainers(disabledWithoutDocker = true)
@DirtiesContext
class DemoPostgresIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void source(DynamicPropertyRegistry registry) throws Exception {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired DataSource target;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;
    @Autowired JavaMailSender mail;

    @Test
    void startupSeedsPostgresWithFlywayAndKeepsSyntheticDataIsolated() throws Exception {
        assertThat(mail).isInstanceOf(DemoMailSender.class);
        try (var c = target.getConnection()) {
            assertThat(c.getMetaData().getURL()).startsWith("jdbc:postgresql:");
        }
        assertThat(users.count()).isEqualTo(323);
        assertThat(jdbc.queryForObject("select count(*) from tl_institutions where code like 'DEMO15-I%'", Integer.class)).isEqualTo(3);
    }
}
