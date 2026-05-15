DO $$
BEGIN
  -- Solo si existe el tipo tl_scope
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'tl_scope'
  ) THEN
    -- Y solo si aún no tiene el valor 'ACADEMICO'
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'tl_scope'
        AND e.enumlabel = 'ACADEMICO'
    ) THEN
      ALTER TYPE tl_scope ADD VALUE 'ACADEMICO';
    END IF;
  END IF;
END;
$$;
