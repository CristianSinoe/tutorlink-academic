-- V13__extend_user_role_check.sql
-- Actualizar la restricción CHECK de role para aceptar también ADMIN

ALTER TABLE tl_users
    DROP CONSTRAINT IF EXISTS tl_users_role_check;

ALTER TABLE tl_users
    ADD CONSTRAINT tl_users_role_check
    CHECK (
        role::text = ANY (
            ARRAY[
                'ESTUDIANTE'::character varying,
                'TUTOR'::character varying,
                'ADMIN'::character varying
            ]::text[]
        )
    );
