-- V6__rework_users_table.sql
-- Limpieza de tl_users y agregado de campos de estado / activación

-- 1) Crear tipo ENUM para status de usuario (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'user_status'
    ) THEN
        CREATE TYPE user_status AS ENUM (
            'CREATED_BY_ADMIN',
            'ACTIVE',
            'DISABLED',
            'BLOCKED'
        );
    END IF;
END$$;

-- 2) Agregar columnas nuevas a tl_users
ALTER TABLE tl_users
    ADD COLUMN status user_status NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN activation_token      VARCHAR(255),
    ADD COLUMN activation_expires_at TIMESTAMPTZ,
    ADD COLUMN last_login_at         TIMESTAMPTZ;

-- 3) Eliminar campos escolares/personales que ahora vivirán en otras tablas
ALTER TABLE tl_users
    DROP COLUMN IF EXISTS career,
    DROP COLUMN IF EXISTS plan,
    DROP COLUMN IF EXISTS semester,
    DROP COLUMN IF EXISTS birth_date,
    DROP COLUMN IF EXISTS phone;
