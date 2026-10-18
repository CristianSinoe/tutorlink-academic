CREATE TABLE IF NOT EXISTS tl_institution_audit_log (
 id BIGSERIAL PRIMARY KEY, institution_id BIGINT REFERENCES tl_institutions(id), actor_user_id BIGINT REFERENCES tl_users(id),
 action VARCHAR(100) NOT NULL, detail TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_institution_audit_institution_created ON tl_institution_audit_log(institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_questions_group_status ON tl_course_questions(group_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_group_due ON tl_tasks(group_id, due_at);
CREATE INDEX IF NOT EXISTS idx_attendance_session_student ON tl_attendance_records(session_id, student_id);
