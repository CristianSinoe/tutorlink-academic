package com.sinoe.authmfa.demo;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;

import java.sql.SQLException;
import java.util.UUID;

@Configuration(proxyBeanMethods = false)
@Profile("demo")
public class DemoConfiguration {
    @Bean(destroyMethod = "close")
    public HikariDataSource dataSource() throws SQLException {
        // Never bind spring.datasource here: those properties identify the read-only source.
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:h2:mem:demo_" + UUID.randomUUID()
                + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=0");
        config.setUsername("sa");
        config.setPassword("");
        config.setMinimumIdle(1);
        HikariDataSource pool = new DemoDataSource(config);
        try (var connection = pool.getConnection(); var statement = connection.createStatement()) {
            statement.execute("CREATE DOMAIN user_status AS VARCHAR(32)");
        } catch (SQLException ex) {
            pool.close();
            throw ex;
        }
        return pool;
    }

    @Bean
    public JavaMailSender demoMailSender() {
        return new DemoMailSender();
    }
}
