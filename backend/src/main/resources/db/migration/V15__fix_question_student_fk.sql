-- Eliminar la FK vieja que apunta a tl_users
ALTER TABLE tl_questions
    DROP CONSTRAINT IF EXISTS fk1a8mvpa9enn6ffl7avx4s1nr4;

-- Crear FK nueva hacia tl_students(id)
ALTER TABLE tl_questions
    ADD CONSTRAINT fk_questions_student
    FOREIGN KEY (student_id)
    REFERENCES tl_students(id);
