-- ============================================================
-- V1 - Initial schema: users, students, state machine, core tables
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users (all actors: students, supervisors, facilitator, HOD, superadmin) ──
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(50),
    role          VARCHAR(50)  NOT NULL,
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
    eligible_examiner BOOLEAN  NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── WhatsApp group links (multiple per supervisor/team) ──
CREATE TABLE whatsapp_groups (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supervisor_id UUID         NOT NULL REFERENCES users(id),
    team_name     VARCHAR(255) NOT NULL,
    link          VARCHAR(512) NOT NULL,
    is_predefense BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Students ──
CREATE TABLE students (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID         NOT NULL UNIQUE REFERENCES users(id),
    reg_number          VARCHAR(100) NOT NULL UNIQUE,
    organisation        VARCHAR(255),
    project_topic       VARCHAR(512),
    group_label         VARCHAR(100),
    state               VARCHAR(50)  NOT NULL DEFAULT 'REGISTERED',
    state_entered_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    supervisor_id       UUID         REFERENCES users(id),
    supervisor_assigned_at TIMESTAMPTZ,
    book_signed_off     BOOLEAN      NOT NULL DEFAULT FALSE,
    proto_attempts      INTEGER      NOT NULL DEFAULT 0,
    flagged             BOOLEAN      NOT NULL DEFAULT FALSE,
    note                TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Student state transition history (the auditable timeline) ──
CREATE TABLE state_transitions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id    UUID         NOT NULL REFERENCES students(id),
    from_state    VARCHAR(50),
    to_state      VARCHAR(50)  NOT NULL,
    actor_id      UUID         NOT NULL REFERENCES users(id),
    actor_role    VARCHAR(50)  NOT NULL,
    note          TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Proposal attempts ──
CREATE TABLE proposal_attempts (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id    UUID         NOT NULL REFERENCES students(id),
    attempt_number INTEGER     NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    reviewed_by   UUID         REFERENCES users(id),
    submitted_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    reviewed_at   TIMESTAMPTZ
);

-- ── Case letter submissions ──
CREATE TABLE case_letters (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id    UUID         NOT NULL REFERENCES students(id),
    file_path     VARCHAR(512),
    submitted_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    approved_by   UUID         REFERENCES users(id),
    approved_at   TIMESTAMPTZ,
    status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
);

-- ── Supervisor availability slots ──
CREATE TABLE availability_slots (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supervisor_id UUID         NOT NULL REFERENCES users(id),
    day_of_week   VARCHAR(10)  NOT NULL,
    start_time    TIME         NOT NULL,
    end_time      TIME         NOT NULL,
    location      VARCHAR(255),
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (supervisor_id, day_of_week, start_time)
);

-- ── Meetings (supervisor sets, confirms, logs) ──
CREATE TABLE meetings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID         NOT NULL REFERENCES students(id),
    supervisor_id   UUID         NOT NULL REFERENCES users(id),
    scheduled_at    TIMESTAMPTZ  NOT NULL,
    confirmed       BOOLEAN      NOT NULL DEFAULT FALSE,
    confirmed_at    TIMESTAMPTZ,
    attended        BOOLEAN,
    topic           VARCHAR(512),
    notes           TEXT,
    meeting_type    VARCHAR(20)  NOT NULL DEFAULT 'IN_PERSON',
    location        VARCHAR(255),
    meet_link       VARCHAR(512),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Pre-defense and defense panel assignments ──
CREATE TABLE panel_assignments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID         NOT NULL REFERENCES students(id),
    examiner_id     UUID         NOT NULL REFERENCES users(id),
    panel_type      VARCHAR(20)  NOT NULL,  -- PRE_DEFENSE | DEFENSE
    scheduled_at    TIMESTAMPTZ,
    outcome         VARCHAR(50),            -- CLEARED | PASSED | REFERRED | FAILED
    outcome_note    TEXT,
    outcome_recorded_at TIMESTAMPTZ,
    assigned_by     UUID         NOT NULL REFERENCES users(id),
    assigned_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, examiner_id, panel_type)
);

-- ── Notification log ──
CREATE TABLE notification_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_key    VARCHAR(100) NOT NULL,
    recipient_id    UUID         NOT NULL REFERENCES users(id),
    student_id      UUID         REFERENCES students(id),
    subject         VARCHAR(512),
    body            TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    error_message   TEXT,
    retry_count     INTEGER      NOT NULL DEFAULT 0,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Audit log (immutable — no updates/deletes allowed from app) ──
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id    UUID         REFERENCES users(id),
    actor_email VARCHAR(255),
    actor_role  VARCHAR(50),
    action      VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id   UUID,
    detail      TEXT,
    ip_address  VARCHAR(50),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Prototype cache (from external API, cached for offline dispute resolution) ──
CREATE TABLE prototype_cache (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID         NOT NULL UNIQUE REFERENCES students(id),
    attempt_count   INTEGER,
    last_status     VARCHAR(50),
    schedule_info   TEXT,
    raw_json        TEXT,
    fetched_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Indexes ──
CREATE INDEX idx_students_state        ON students(state);
CREATE INDEX idx_students_supervisor   ON students(supervisor_id);
CREATE INDEX idx_state_transitions_student ON state_transitions(student_id);
CREATE INDEX idx_meetings_student      ON meetings(student_id);
CREATE INDEX idx_meetings_supervisor   ON meetings(supervisor_id);
CREATE INDEX idx_notification_logs_recipient ON notification_logs(recipient_id);
CREATE INDEX idx_notification_logs_status    ON notification_logs(status);
CREATE INDEX idx_audit_logs_actor      ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created    ON audit_logs(created_at DESC);
CREATE INDEX idx_panel_assignments_student ON panel_assignments(student_id);
