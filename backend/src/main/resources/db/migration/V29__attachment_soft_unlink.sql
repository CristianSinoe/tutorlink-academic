ALTER TABLE tl_academic_attachments ADD COLUMN IF NOT EXISTS unlinked_at TIMESTAMPTZ;
ALTER TABLE tl_academic_attachments ADD COLUMN IF NOT EXISTS unlinked_by_user_id BIGINT REFERENCES tl_users(id);
ALTER TABLE tl_academic_attachments ADD COLUMN IF NOT EXISTS unlink_reason VARCHAR(500);
CREATE INDEX IF NOT EXISTS idx_attachments_active ON tl_academic_attachments(institution_id, id) WHERE unlinked_at IS NULL;
