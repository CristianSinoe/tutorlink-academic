-- V3__add_status_CORREGIDA.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'CORREGIDA'
      AND enumtypid = 'tl_status'::regtype
  ) THEN
    ALTER TYPE tl_status ADD VALUE 'CORREGIDA' AFTER 'PUBLICADA';
  END IF;
END $$;
