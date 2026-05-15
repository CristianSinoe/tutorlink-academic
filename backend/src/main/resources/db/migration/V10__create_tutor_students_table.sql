-- V10__create_tutor_students_table.sql
-- Relación entre tutores y estudiantes (tutorados)

CREATE TABLE IF NOT EXISTS tl_tutor_students (
    id          BIGSERIAL PRIMARY KEY,

    tutor_id    BIGINT NOT NULL
        REFERENCES tl_tutors(id) ON DELETE CASCADE,

    student_id  BIGINT NOT NULL
        REFERENCES tl_students(id) ON DELETE CASCADE,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Admin que hizo la asignación (opcional, puede ser NULL)
    created_by  BIGINT
        REFERENCES tl_users(id) ON DELETE SET NULL
);

-- No permitir duplicados tutor–estudiante
CREATE UNIQUE INDEX IF NOT EXISTS uq_tl_tutor_students_tutor_student
    ON tl_tutor_students(tutor_id, student_id);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_tl_tutor_students_tutor
    ON tl_tutor_students(tutor_id);

CREATE INDEX IF NOT EXISTS idx_tl_tutor_students_student
    ON tl_tutor_students(student_id);
