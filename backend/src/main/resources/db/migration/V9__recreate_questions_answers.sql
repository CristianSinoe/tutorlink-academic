-- V9__recreate_questions_answers.sql
-- Re-creación de preguntas / respuestas apuntando a tl_students y tl_tutors

-- 1) Soltar tablas antiguas (si existen)
DROP TABLE IF EXISTS tl_question_audit CASCADE;
DROP TABLE IF EXISTS tl_answers CASCADE;
DROP TABLE IF EXISTS tl_questions CASCADE;

-- 2) Tabla de preguntas
CREATE TABLE tl_questions (
    id                  BIGSERIAL PRIMARY KEY,

    -- Ahora apuntamos al perfil de estudiante
    student_id          BIGINT NOT NULL
        REFERENCES tl_students(id) ON DELETE CASCADE,

    -- Tutor asignado (puede ser NULL mientras nadie la toma)
    tutor_id            BIGINT
        REFERENCES tl_tutors(id) ON DELETE SET NULL,

    scope               VARCHAR(30) NOT NULL,         -- GENERAL / PROGRAMA / PLAN / SEMESTRE...
    status              VARCHAR(30) NOT NULL,         -- PENDIENTE / PUBLICADA / RECHAZADA / CORREGIDA...

    title               VARCHAR(200) NOT NULL,
    body                TEXT NOT NULL,

    reject_reason       TEXT,

    current_answer_id   BIGINT,                       -- se agrega FK después de crear tl_answers

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) Tabla de respuestas
CREATE TABLE tl_answers (
    id              BIGSERIAL PRIMARY KEY,

    question_id     BIGINT NOT NULL
        REFERENCES tl_questions(id) ON DELETE CASCADE,

    tutor_id        BIGINT NOT NULL
        REFERENCES tl_tutors(id) ON DELETE RESTRICT,

    body            TEXT NOT NULL,

    is_correction   BOOLEAN NOT NULL DEFAULT FALSE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) Ahora sí, relacionar current_answer_id con tl_answers
ALTER TABLE tl_questions
    ADD CONSTRAINT fk_tl_questions_current_answer
    FOREIGN KEY (current_answer_id)
    REFERENCES tl_answers(id);

-- 5) Índices principales (equivalentes a los que tenías en V5)
CREATE INDEX idx_tl_questions_student_id
    ON tl_questions(student_id);

CREATE INDEX idx_tl_questions_tutor_id
    ON tl_questions(tutor_id);

CREATE INDEX idx_tl_questions_status
    ON tl_questions(status);

CREATE INDEX idx_tl_questions_scope
    ON tl_questions(scope);

CREATE INDEX idx_tl_questions_created_at
    ON tl_questions(created_at);

CREATE INDEX idx_tl_answers_question_id
    ON tl_answers(question_id);

CREATE INDEX idx_tl_answers_tutor_id
    ON tl_answers(tutor_id);

-- 6) Tabla de auditoría de cambios en preguntas
CREATE TABLE tl_question_audit (
    id              BIGSERIAL PRIMARY KEY,

    question_id     BIGINT NOT NULL
        REFERENCES tl_questions(id) ON DELETE CASCADE,

    -- Quién hizo el cambio (usuario del sistema, admin/tutor/etc.)
    changed_by      BIGINT
        REFERENCES tl_users(id) ON DELETE SET NULL,

    field           VARCHAR(100) NOT NULL,   -- campo cambiado (status, scope, etc.)
    old_value       TEXT,
    new_value       TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tl_question_audit_question_id
    ON tl_question_audit(question_id);

CREATE INDEX idx_tl_question_audit_changed_by
    ON tl_question_audit(changed_by);
