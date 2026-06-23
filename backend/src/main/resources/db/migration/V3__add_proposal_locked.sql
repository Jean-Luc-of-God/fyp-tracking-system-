-- V3 - Add proposal_locked flag to students
-- Locked when a student reaches 3 proposal rejections; only the HOD can unlock.
ALTER TABLE students ADD COLUMN proposal_locked BOOLEAN NOT NULL DEFAULT FALSE;
