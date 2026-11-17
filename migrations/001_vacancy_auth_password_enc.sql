-- S1: HH credentials at rest — add ciphertext columns (plaintext password kept temporarily for backfill).
ALTER TABLE vacancy_auth ADD COLUMN IF NOT EXISTS password_enc TEXT;
ALTER TABLE vacancy_auth ADD COLUMN IF NOT EXISTS enc_v SMALLINT;

COMMENT ON COLUMN vacancy_auth.password_enc IS 'AES-256-GCM ciphertext (base64: iv.tag.ciphertext); plaintext password column deprecated';
COMMENT ON COLUMN vacancy_auth.enc_v IS 'HH cred encryption key version (1 = HH_CRED_KEY)';
