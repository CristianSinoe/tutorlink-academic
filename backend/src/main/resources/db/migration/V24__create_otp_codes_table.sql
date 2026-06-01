-- V24__create_otp_codes_table.sql
-- Persistencia de OTP para login MFA y control de reenvios.

CREATE TABLE IF NOT EXISTS otp_codes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_sent_at TIMESTAMPTZ,
    purpose VARCHAR(30) NOT NULL,
    public_id VARCHAR(100) NOT NULL,
    consumed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_otp_user_id
    ON otp_codes (user_id);

CREATE INDEX IF NOT EXISTS idx_otp_expires_at
    ON otp_codes (expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_public_id
    ON otp_codes (public_id);
