-- V16__fix_answers_tutor_fk.sql
-- Arreglar la foreign key de tl_answers.tutor_id para que apunte a tl_tutors(id)
-- en lugar de tl_users(id)

-- 1) Verificamos y eliminamos la FK vieja (la que marca el error)
ALTER TABLE tl_answers
    DROP CONSTRAINT IF EXISTS fkse5s4m2kv8ve61jepp8qjre5o;

-- Si por alguna razón el nombre fuera diferente en otra BD, también puedes
-- dejar este por seguridad (no pasa nada si no existe):
ALTER TABLE tl_answers
    DROP CONSTRAINT IF EXISTS fk_answers_tutor_old;

-- 2) Creamos la FK correcta hacia tl_tutors(id)
ALTER TABLE tl_answers
    ADD CONSTRAINT fk_answers_tutor
    FOREIGN KEY (tutor_id)
    REFERENCES tl_tutors(id);
