package com.sinoe.authmfa.demo;

import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.domain.user.UserStatus;
import org.flywaydb.core.Flyway;
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
import java.sql.DriverManager;
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
        Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .load().migrate();
        try (var c = DriverManager.getConnection(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
             var s = c.createStatement()) {
            s.execute("insert into tl_users(id,name,last_name_paterno,email,password_hash,role,status) "
                    + "values (500,'Original','Prueba','original@example.invalid','test-hash','ADMIN','ACTIVE')");
        }
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired DataSource target;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;
    @Autowired JavaMailSender mail;

    @Test
    void startupCopiesPostgresEnumsAndLeavesSourceUntouchedAfterDemoChanges() throws Exception {
        assertThat(mail).isInstanceOf(DemoMailSender.class);
        try (var c = target.getConnection()) {
            assertThat(c.getMetaData().getURL()).startsWith("jdbc:h2:mem:");
        }
        assertThat(users.count()).isEqualTo(321);
        var original = users.findById(500L).orElseThrow();
        assertThat(original.getStatus()).isEqualTo(UserStatus.ACTIVE);
        original.setName("Solo cambia en memoria");
        users.saveAndFlush(original);
        assertThat(jdbc.queryForObject("select min(id) from tl_users where id <> 500", Long.class)).isEqualTo(501L);
        try (var c = DriverManager.getConnection(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
             var s = c.createStatement(); var r = s.executeQuery("select name from tl_users")) {
            r.next();
            assertThat(r.getString(1)).isEqualTo("Original");
            assertThat(r.next()).isFalse();
        }
    }
}
