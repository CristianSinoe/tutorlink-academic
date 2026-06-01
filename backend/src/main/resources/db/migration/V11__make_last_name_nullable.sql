-- V11__make_last_name_nullable.sql
-- Hacer last_name opcional solo si el esquema legacy aun conserva esa columna.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tl_users'
          AND column_name = 'last_name'
    ) THEN
        EXECUTE 'ALTER TABLE tl_users ALTER COLUMN last_name DROP NOT NULL';
    END IF;
END$$;

-- Compatibilidad con esquemas legacy que aun tengan last_name_paterno.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tl_users'
          AND column_name = 'last_name_paterno'
    ) THEN
        EXECUTE $sql$
            UPDATE tl_users
            SET last_name = COALESCE(last_name, last_name_paterno)
            WHERE last_name IS NULL
        $sql$;
    END IF;
END$$;
