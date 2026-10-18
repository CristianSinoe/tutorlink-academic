-- Preserve existing IDs, accounts, enrollments, assignments and conversations.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conrelid::regclass AS tbl, c.conname
    FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attname='user_id'
    WHERE c.contype='u' AND c.conrelid IN ('tl_students'::regclass,'tl_tutors'::regclass,'tl_teachers'::regclass)
      AND c.conkey=ARRAY[a.attnum]::smallint[]
  LOOP EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',r.tbl,r.conname); END LOOP;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uk_students_institution_user ON tl_students(institution_id,user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_tutors_institution_user ON tl_tutors(institution_id,user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_teachers_institution_user ON tl_teachers(institution_id,user_id);
ALTER TABLE tl_institution_memberships DROP CONSTRAINT IF EXISTS ck_membership_status;
ALTER TABLE tl_institution_memberships ADD CONSTRAINT ck_membership_status CHECK(status IN ('ACTIVE','SUSPENDED','REVOKED'));
ALTER TABLE tl_institution_memberships ADD COLUMN contact_email VARCHAR(190);
ALTER TABLE tl_institution_memberships ADD COLUMN contact_verified_at TIMESTAMPTZ;
CREATE TABLE tl_institution_invitations (
 id BIGSERIAL PRIMARY KEY,
 institution_id BIGINT NOT NULL REFERENCES tl_institutions(id),
 created_by_user_id BIGINT NOT NULL REFERENCES tl_users(id),
 target_user_id BIGINT REFERENCES tl_users(id),
 contact_email VARCHAR(190) NOT NULL,
 role VARCHAR(20) NOT NULL CHECK(role IN ('ESTUDIANTE','DOCENTE','TUTOR')),
 profile_data JSONB NOT NULL,
 token_hash CHAR(64) NOT NULL UNIQUE,
 expires_at TIMESTAMPTZ NOT NULL,
 accepted_at TIMESTAMPTZ,
 revoked_at TIMESTAMPTZ,
 accepted_by_user_id BIGINT REFERENCES tl_users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_institution_invitations_pending ON tl_institution_invitations(institution_id,expires_at) WHERE accepted_at IS NULL;
