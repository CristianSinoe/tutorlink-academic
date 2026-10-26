package com.sinoe.authmfa.demo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import javax.sql.DataSource;

@Component
@Profile("demo | local")
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class DemoStartup implements ApplicationRunner {
    private final DataSource dataSource;
    private final DemoDataSeeder seeder;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        String url;
        try (var connection = dataSource.getConnection()) { url = connection.getMetaData().getURL(); }
        if (url == null || !url.startsWith("jdbc:postgresql:")) {
            throw new IllegalStateException("El perfil demo requiere PostgreSQL aislado; no se admite una fuente externa ni H2.");
        }
        seeder.seed();
        log.info("DEMO listo: datos sintéticos en PostgreSQL aislado.");
    }
}
