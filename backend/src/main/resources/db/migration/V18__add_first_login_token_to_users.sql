ALTER TABLE tl_users
    ADD COLUMN first_login_token VARCHAR(64),
    ADD COLUMN first_login_expires_at TIMESTAMPTZ;
