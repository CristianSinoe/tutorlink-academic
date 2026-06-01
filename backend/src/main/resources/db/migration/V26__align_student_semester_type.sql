-- V26__align_student_semester_type.sql
-- Hibernate valida semester como INTEGER en el modelo Student actual.

ALTER TABLE tl_students
    ALTER COLUMN semester TYPE INTEGER
    USING semester::INTEGER;
