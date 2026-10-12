package com.sinoe.authmfa.demo;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/** Copies only mapped application columns, preserving IDs and cyclic references. */
public final class DemoSnapshot {
    private DemoSnapshot() {}

    public static long copy(Connection source, Connection target) throws SQLException {
        if (!target.getMetaData().getURL().startsWith("jdbc:h2:mem:")) {
            throw new SQLException("La copia demo requiere un destino H2 en memoria");
        }
        source.setReadOnly(true);
        source.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);
        source.setAutoCommit(false);
        List<String> tables = new ArrayList<>();
        try (ResultSet rs = target.getMetaData().getTables(null, "public", "%", new String[]{"TABLE"})) {
            while (rs.next()) tables.add(rs.getString("TABLE_NAME"));
        }
        long total = 0;
        try (Statement ddl = target.createStatement()) {
            ddl.execute("SET REFERENTIAL_INTEGRITY FALSE");
            try {
                for (String table : tables) total += copyTable(source, target, table);
            } finally {
                ddl.execute("SET REFERENTIAL_INTEGRITY TRUE");
                source.rollback();
            }
            for (String table : tables) {
                ddl.execute("ALTER TABLE " + quote(table) + " SET REFERENTIAL_INTEGRITY TRUE CHECK");
            }
        }
        return total;
    }

    private static long copyTable(Connection source, Connection target, String table) throws SQLException {
        List<String> columns = new ArrayList<>();
        List<String> identities = new ArrayList<>();
        try (ResultSet rs = target.getMetaData().getColumns(null, "public", table, "%")) {
            while (rs.next()) {
                String name = rs.getString("COLUMN_NAME");
                columns.add(name);
                if ("YES".equals(rs.getString("IS_AUTOINCREMENT"))) identities.add(name);
            }
        }
        String names = columns.stream().map(DemoSnapshot::quote).collect(Collectors.joining(","));
        String placeholders = columns.stream().map(c -> "?").collect(Collectors.joining(","));
        long count = 0;
        // Resolve tables via the source search_path (also supports PostgreSQL currentSchema).
        try (Statement read = source.createStatement();
             PreparedStatement write = target.prepareStatement("INSERT INTO " + quote(table)
                     + " (" + names + ") VALUES (" + placeholders + ")")) {
            read.setFetchSize(500);
            try (ResultSet rows = read.executeQuery("SELECT " + names + " FROM " + quote(table))) {
                ResultSetMetaData metadata = rows.getMetaData();
                while (rows.next()) {
                    for (int i = 1; i <= columns.size(); i++) {
                        // PostgreSQL enums are PGobject instances; H2 accepts their textual value.
                        Object value = metadata.getColumnType(i) == Types.OTHER
                                ? rows.getString(i) : rows.getObject(i);
                        write.setObject(i, value);
                    }
                    write.addBatch();
                    if (++count % 500 == 0) write.executeBatch();
                }
                write.executeBatch();
            }
        }
        for (String identity : identities) {
            try (Statement statement = target.createStatement();
                 ResultSet rs = statement.executeQuery("SELECT COALESCE(MAX(" + quote(identity)
                         + "), 0) + 1 FROM " + quote(table))) {
                rs.next();
                long nextId = rs.getLong(1);
                try (Statement ddl = target.createStatement()) {
                    ddl.execute("ALTER TABLE " + quote(table) + " ALTER COLUMN " + quote(identity)
                            + " RESTART WITH " + nextId);
                }
            }
        }
        return count;
    }

    private static String quote(String identifier) {
        return "\"" + identifier.replace("\"", "\"\"") + "\"";
    }
}
