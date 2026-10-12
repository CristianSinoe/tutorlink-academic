package com.sinoe.authmfa.demo;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/** Keeps the database alive even when Hikari retires all idle pooled connections. */
final class DemoDataSource extends HikariDataSource {
    private final Connection lifetimeConnection;

    DemoDataSource(HikariConfig config) throws SQLException {
        super(config);
        try {
            lifetimeConnection = DriverManager.getConnection(
                    config.getJdbcUrl(), config.getUsername(), config.getPassword());
        } catch (SQLException ex) {
            super.close();
            throw ex;
        }
    }

    @Override
    public void close() {
        try {
            super.close();
        } finally {
            try {
                if (lifetimeConnection != null) lifetimeConnection.close();
            } catch (SQLException ex) {
                throw new IllegalStateException("No se pudo cerrar la base temporal", ex);
            }
        }
    }
}
