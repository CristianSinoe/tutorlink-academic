package com.sinoe.authmfa.demo;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Locale;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** Refuses the local E2E profile unless it points at the disposable compose database. */
@Component
@Profile("e2e")
@Order(-100)
public class E2eDatasourceGuard implements ApplicationRunner {
    private final DataSource dataSource;

    public E2eDatasourceGuard(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            String url = connection.getMetaData().getURL().toLowerCase(Locale.ROOT);
            boolean approved = url.startsWith("jdbc:postgresql://127.0.0.1:55433/tutorlink_e2e")
                    || url.startsWith("jdbc:postgresql://localhost:55433/tutorlink_e2e");
            if (!approved) {
                throw new IllegalStateException("El perfil e2e solo admite PostgreSQL local tutorlink_e2e en el puerto 55433");
            }
        }
    }
}
