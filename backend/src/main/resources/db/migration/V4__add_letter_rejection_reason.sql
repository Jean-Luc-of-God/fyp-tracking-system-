-- V4 - Separate letter rejection reason from general student note
-- Prevents silent data loss when flag/note operations overwrite rejection context

ALTER TABLE students ADD COLUMN letter_rejection_reason TEXT;
