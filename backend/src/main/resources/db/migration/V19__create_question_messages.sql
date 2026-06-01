CREATE TABLE tl_question_messages (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES tl_questions(id) ON DELETE CASCADE,
    sender_user_id BIGINT NOT NULL REFERENCES tl_users(id),
    sender_role VARCHAR(30) NOT NULL,
    message_type VARCHAR(30) NOT NULL,
    body TEXT NOT NULL,
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_question_messages_question_created
    ON tl_question_messages(question_id, created_at, id);

CREATE INDEX idx_question_messages_sender
    ON tl_question_messages(sender_user_id);
