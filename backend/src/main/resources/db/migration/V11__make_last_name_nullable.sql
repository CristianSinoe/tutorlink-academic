-- V11__make_last_name_nullable.sql
-- Hacer last_name opcional (legacy) para que no rompa los inserts nuevos

ALTER TABLE tl_users
    ALTER COLUMN last_name DROP NOT NULL;

-- Opcional: rellenar last_name con el paterno si está vacío
UPDATE tl_users
SET last_name = COALESCE(last_name, last_name_paterno)
WHERE last_name IS NULL;
