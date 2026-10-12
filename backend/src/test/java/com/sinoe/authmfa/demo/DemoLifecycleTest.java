package com.sinoe.authmfa.demo;

import org.junit.jupiter.api.Test;
import java.sql.DriverManager;
import java.sql.SQLException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

class DemoLifecycleTest {
    @Test
    void connectionRetirementDoesNotDiscardSession() throws Exception {
        try (var pool = new DemoConfiguration().dataSource()) {
            try (var c = pool.getConnection(); var s = c.createStatement()) {
                s.execute("create table session_data(id bigint)");
                s.execute("insert into session_data values (42)");
            }
            pool.setMinimumIdle(0);
            pool.getHikariPoolMXBean().softEvictConnections();
            await().until(() -> pool.getHikariPoolMXBean().getTotalConnections() == 0);
            try (var c = pool.getConnection(); var s = c.createStatement();
                 var rows = s.executeQuery("select id from session_data")) {
                rows.next();
                assertThat(rows.getLong(1)).isEqualTo(42);
            }
        }
    }

    @Test
    void closingApplicationPoolRemovesTheDatabase() throws Exception {
        var pool = new DemoConfiguration().dataSource();
        String url = pool.getJdbcUrl();
        try (pool; var c = pool.getConnection(); var s = c.createStatement()) {
            s.execute("create table temporary_data(id bigint)");
            s.execute("insert into temporary_data values (1)");
        }
        try (var c = DriverManager.getConnection(url, "sa", ""); var s = c.createStatement()) {
            assertThatThrownBy(() -> s.executeQuery("select * from temporary_data"))
                    .isInstanceOf(SQLException.class);
        }
    }
}
