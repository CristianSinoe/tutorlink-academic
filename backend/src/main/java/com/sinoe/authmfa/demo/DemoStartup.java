package com.sinoe.authmfa.demo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import javax.sql.DataSource;
import java.sql.DriverManager;
import java.util.Properties;

@Component
@Profile("demo")
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class DemoStartup implements ApplicationRunner {
    private final DataSource dataSource;
    private final Environment environment;
    private final DemoDataSeeder seeder;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        String url = environment.getRequiredProperty("spring.datasource.url");
        if (!url.startsWith("jdbc:postgresql:")) {
            throw new IllegalArgumentException("El origen demo debe ser PostgreSQL (spring.datasource.url / DB_*)");
        }
        Properties properties = new Properties();
        properties.setProperty("user", environment.getRequiredProperty("spring.datasource.username"));
        properties.setProperty("password", environment.getRequiredProperty("spring.datasource.password"));
        properties.setProperty("readOnly", "true");
        properties.setProperty("readOnlyMode", "always");
        properties.setProperty("connectTimeout", "10");
        try (var source = DriverManager.getConnection(url, properties);
             var target = dataSource.getConnection()) {
            long rows = DemoSnapshot.copy(source, target);
            log.info("DEMO: {} registros copiados a memoria. PostgreSQL permanece sin cambios.", rows);
        }
        seeder.seed();
        log.info("DEMO listo: datos temporales y correos simulados en consola. Al cerrar se pierde toda la sesión.");
    }
}
