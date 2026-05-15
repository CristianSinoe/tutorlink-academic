-- V14__enforce_unique_student_in_tutor_students.sql
-- Asegura que un estudiante solo pueda tener 1 tutor a la vez

-- Índice por si queremos consultar por tutor_id
CREATE INDEX IF NOT EXISTS idx_tl_tutor_students_tutor
    ON tl_tutor_students (tutor_id);

-- Aseguramos unicidad de student_id
ALTER TABLE tl_tutor_students
    ADD CONSTRAINT uq_tl_tutor_students_student UNIQUE (student_id);
