CREATE INDEX IF NOT EXISTS idx_questions_student_created
  ON tl_questions(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_status_created
  ON tl_questions(status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_questions_status_scope_created
  ON tl_questions(status, scope, created_at ASC);