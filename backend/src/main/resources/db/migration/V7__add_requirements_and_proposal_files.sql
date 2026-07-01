ALTER TABLE students ADD COLUMN IF NOT EXISTS requirements_file_name VARCHAR(255);
ALTER TABLE proposal_attempts ADD COLUMN IF NOT EXISTS proposal_file_name VARCHAR(255);
