ALTER TABLE tl_questions ADD COLUMN IF NOT EXISTS current_answer_id BIGINT;
ALTER TABLE tl_questions ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE tl_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- FK opcional (siempre que tl_answers ya exista)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_questions_current_answer'
    ) THEN
        ALTER TABLE tl_questions
          ADD CONSTRAINT fk_questions_current_answer
          FOREIGN KEY (current_answer_id) REFERENCES tl_answers(id);
    END IF;
END $$;
