-- V25__add_answer_version_column.sql
-- Restablecer la columna version requerida por el modelo Answer actual.

ALTER TABLE tl_answers
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
