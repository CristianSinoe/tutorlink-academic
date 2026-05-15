ALTER TABLE tl_tutors
    ADD COLUMN bio TEXT,
    ADD COLUMN academic_link VARCHAR(255),
    ADD COLUMN professional_link VARCHAR(255),
    ADD COLUMN notify_new_questions BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN weekly_summary BOOLEAN NOT NULL DEFAULT FALSE;
