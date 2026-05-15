-- V7__create_students_table.sql
-- Tabla de perfil académico para ESTUDIANTES

CREATE TABLE IF NOT EXISTS tl_students (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL UNIQUE
        REFERENCES tl_users(id) ON DELETE CASCADE,

    matricula   VARCHAR(50) NOT NULL UNIQUE,

    career      VARCHAR(100),
    plan        VARCHAR(50),
    semester    SMALLINT,
    birth_date  DATE,
    phone       VARCHAR(20),

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tl_students_matricula
    ON tl_students(matricula);

CREATE INDEX IF NOT EXISTS idx_tl_students_user_id
    ON tl_students(user_id);
