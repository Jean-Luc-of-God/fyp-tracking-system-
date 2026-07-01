ALTER TABLE students ADD COLUMN IF NOT EXISTS defense_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE panel_assignments ADD COLUMN IF NOT EXISTS attempt_number INT NOT NULL DEFAULT 1;

ALTER TABLE panel_assignments DROP CONSTRAINT IF EXISTS panel_assignments_student_id_examiner_id_panel_type_key;
ALTER TABLE panel_assignments ADD CONSTRAINT panel_assignments_student_panel_attempt_key
    UNIQUE (student_id, panel_type, attempt_number);
