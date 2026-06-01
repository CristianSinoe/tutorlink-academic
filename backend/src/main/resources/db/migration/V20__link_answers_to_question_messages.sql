ALTER TABLE tl_answers
    ADD COLUMN thread_message_id BIGINT NULL;

ALTER TABLE tl_answers
    ADD CONSTRAINT fk_answers_thread_message
        FOREIGN KEY (thread_message_id)
        REFERENCES tl_question_messages(id);

CREATE UNIQUE INDEX uq_answers_thread_message_id
    ON tl_answers(thread_message_id)
    WHERE thread_message_id IS NOT NULL;
