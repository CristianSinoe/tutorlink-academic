-- V8__create_tutors_table.sql
-- Tabla de perfil para TUTORES

CREATE TABLE IF NOT EXISTS tl_tutors (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL UNIQUE
        REFERENCES tl_users(id) ON DELETE CASCADE,

    tutor_code   VARCHAR(50) NOT NULL UNIQUE,   -- código interno / nómina / similar a matrícula
    department   VARCHAR(100),
    specialty    VARCHAR(150),
    phone        VARCHAR(20),

    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tl_tutors_user_id
    ON tl_tutors(user_id);

CREATE INDEX IF NOT EXISTS idx_tl_tutors_code
    ON tl_tutors(tutor_code);
