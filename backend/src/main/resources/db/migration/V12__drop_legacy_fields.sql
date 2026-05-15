-- Quitar columnas legacy que ya no existen en User.java
-- y pertenecen ahora a tl_students y tl_tutors

ALTER TABLE tl_users
    DROP COLUMN IF EXISTS birth_date,
    DROP COLUMN IF EXISTS career,
    DROP COLUMN IF EXISTS plan,
    DROP COLUMN IF EXISTS semester,
    DROP COLUMN IF EXISTS phone;
