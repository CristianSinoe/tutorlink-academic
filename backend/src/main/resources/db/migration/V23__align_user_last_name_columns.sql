-- V23__align_user_last_name_columns.sql
-- Alinear el esquema historico de tl_users con el modelo actual de JPA.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tl_users'
          AND column_name = 'last_name'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tl_users'
          AND column_name = 'last_name_paterno'
    ) THEN
        EXECUTE 'ALTER TABLE tl_users RENAME COLUMN last_name TO last_name_paterno';
    END IF;
END$$;

ALTER TABLE tl_users
    ADD COLUMN IF NOT EXISTS last_name_materno VARCHAR(120);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tl_users'
          AND column_name = 'last_name'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tl_users'
          AND column_name = 'last_name_paterno'
    ) THEN
        EXECUTE $sql$
            UPDATE tl_users
            SET last_name_paterno = COALESCE(last_name_paterno, last_name)
            WHERE last_name_paterno IS NULL
        $sql$;
    END IF;
END$$;

ALTER TABLE tl_users
    ALTER COLUMN last_name_paterno SET NOT NULL;
