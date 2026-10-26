ALTER TABLE otp_codes ADD COLUMN institution_id BIGINT REFERENCES tl_institutions(id);
CREATE INDEX idx_otp_institution_id ON otp_codes(institution_id);
