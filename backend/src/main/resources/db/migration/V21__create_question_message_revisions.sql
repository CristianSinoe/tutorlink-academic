CREATE TABLE tl_question_message_revisions (
    id BIGSERIAL PRIMARY KEY,
    question_message_id BIGINT NOT NULL REFERENCES tl_question_messages(id) ON DELETE CASCADE,
    created_by_user_id BIGINT NOT NULL REFERENCES tl_users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_question_message_revisions_message_created
    ON tl_question_message_revisions(question_message_id, created_at, id);
