# FYP Tracking & Accountability System — CLAUDE.md

This file gives Claude Code full context about this project. Read it before making any changes.

---

## Project Overview

A Final Year Project (FYP) tracking system for AAUCA (American University in Central Africa, Kigali Rwanda).
It tracks students from project registration through supervision, proposal, pre-defense, and final defense.

- **Repo**: `Jean-Luc-of-God/fyp-tracking-system-`
- **Branch**: `claude/inspiring-wright-jyjnjb` — all development goes here
- **Owner email**: kwizerajeanluc30@gmail.com

---

## Monorepo Structure

```
fyp-tracking-system-/
├── backend/          # Spring Boot 3.2.5, Java 17+, Maven
├── frontend/         # React 19, TypeScript, Vite
├── docker-compose.yml
├── .env.example      # Copy to .env and fill in values
└── CLAUDE.md         # This file
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3.2.5, Java 17 (works on 21) |
| ORM | Spring Data JPA + Hibernate |
| Database | PostgreSQL 16 |
| Migrations | Flyway |
| Cache | Redis 7 |
| Auth | Spring Security + JWT (jjwt 0.11.5), BCrypt cost 12 |
| Email | Spring Mail (JavaMailSender) |
| Excel import | Apache POI 5.2.5 |
| Frontend | React 19, TypeScript, Vite |

---

## Roles

```
STUDENT, SUPERVISOR, FACILITATOR, HOD, EXAMINER, SUPERADMIN
```

- **SUPERADMIN** — manages users, can do everything
- **HOD** — Head of Department, oversight and approvals
- **FACILITATOR** — coordinates FYP process
- **SUPERVISOR** — assigned per student, schedules meetings, signs off
- **EXAMINER** — assigned to pre-defense / defense panels
- **STUDENT** — submits proposals, tracks own progress

---

## Student State Machine (13 states)

```
REGISTERED → CASE_LETTER_SUBMITTED → CASE_LETTER_APPROVED → PROTOTYPE_REVIEW
PROTOTYPE_REVIEW → PROTOTYPE_REVIEW   (re-presentation loop; proto_attempts incremented)
PROTOTYPE_REVIEW → PROTOTYPE_GRANTED → PROPOSAL_UNDER_REVIEW
PROPOSAL_UNDER_REVIEW → PROPOSAL_UNDER_REVIEW   (rejection loop; attempt + reason recorded)
PROPOSAL_UNDER_REVIEW → PROPOSAL_ACCEPTED → SUPERVISION → BOOK_SUBMITTED
BOOK_SUBMITTED → PRE_DEFENSE → DEFENSE → COMPLETED
Any non-terminal state → WITHDRAWN
```

- `FLAGGED` is a boolean column on the student record, not a state — any authorised actor can flag a student while they remain in their current state.
- `WITHDRAWN` is terminal: once withdrawn, no further transitions are allowed.
- `COMPLETED` is terminal.
- Proposal rejection attempts are tracked in the `proposal_attempts` table (Phase 2b enforces the 3-attempt limit there).
- Prototype re-presentation attempts are tracked in `students.proto_attempts`.

Valid transitions are enforced in `StudentStateService.java` — invalid transitions throw `InvalidStateTransitionException`.

---

## Default Credentials (dev only)

| Email | Password | Role |
|---|---|---|
| admin@aauca.ac.rw | Admin@1234 | SUPERADMIN |

---

## Running Locally

### Prerequisites
- Java 17+ (`java --version`)
- Maven (`mvn --version`)
- PostgreSQL 16 running locally
- Redis running locally

### Database setup (first time only)
```bash
psql -U postgres -c "CREATE USER fyp_user WITH PASSWORD 'fyp_pass';"
psql -U postgres -c "CREATE DATABASE fyp_tracker OWNER fyp_user;"
psql -U postgres -d fyp_tracker -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

### Start backend
```bash
cp .env.example .env   # edit JWT_SECRET at minimum
cd backend
mvn spring-boot:run
```
Backend runs on `http://localhost:8080`. Flyway auto-runs migrations on startup.

### Start frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

### Health check
```bash
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}
```

---

## Environment Variables (.env)

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fyp_tracker
DB_USER=fyp_user
DB_PASS=fyp_pass

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=<any-random-string-at-least-32-chars>

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@aauca.ac.rw
MAIL_PASS=your-app-password

FRONTEND_URL=http://localhost:5173
```

---

## Backend Package Structure

```
rw.aauca.fyp/
├── config/
│   └── SecurityConfig.java         # Spring Security, JWT filter, CORS, BCrypt bean
├── controller/
│   ├── AuthController.java         # POST /api/auth/login
│   ├── StudentController.java      # /api/students/**
│   ├── SupervisionController.java  # /api/supervision/**
│   └── UserController.java         # /api/users/**
├── dto/
│   ├── request/                    # CreateUserRequest, LoginRequest, AvailabilitySlotRequest,
│   │                               #   ScheduleMeetingRequest, MeetingOutcomeRequest
│   └── response/                   # AuthResponse, StudentResponse
├── entity/
│   ├── User.java                   # implements UserDetails, passwordHash field
│   ├── Student.java                # OneToOne → User, ManyToOne → supervisor User
│   ├── StateTransition.java        # every state change recorded here
│   ├── AvailabilitySlot.java       # supervisor weekly time windows
│   ├── Meeting.java                # supervisor-student meetings
│   ├── ProposalAttempt.java        # tracks proposal submissions (max 3)
│   ├── PanelAssignment.java        # pre-defense / defense panel
│   ├── NotificationLog.java        # every email sent, with status
│   ├── AuditLog.java               # immutable action log
│   └── WhatsAppGroup.java          # WhatsApp group links per cohort
├── enums/
│   ├── Role.java                   # STUDENT SUPERVISOR FACILITATOR HOD EXAMINER SUPERADMIN
│   ├── StudentState.java           # 12 states
│   ├── NotificationStatus.java     # PENDING SENT FAILED RETRIED
│   └── ProposalStatus.java         # PENDING ACCEPTED REJECTED
├── exception/
│   ├── InvalidStateTransitionException.java
│   └── GlobalExceptionHandler.java  # @RestControllerAdvice
├── repository/                     # JPA repositories for all entities
├── security/
│   ├── JwtUtil.java                # generate/validate JWT, HMAC-SHA256
│   └── JwtAuthFilter.java          # OncePerRequestFilter, reads Bearer token
└── service/
    ├── AuthService.java            # login → JWT
    ├── UserService.java            # CRUD users, enable/disable, reset password
    ├── StudentService.java         # Excel import (Apache POI), assign supervisor
    ├── StudentStateService.java    # state machine enforcement + audit
    ├── SupervisionService.java     # availability slots + meetings
    └── AuditService.java           # write to audit_logs
```

---

## API Endpoints (implemented so far)

### Auth
| Method | Path | Role | Description |
|---|---|---|---|
| POST | /api/auth/login | public | Returns JWT token |

### Users
| Method | Path | Role | Description |
|---|---|---|---|
| GET | /api/users | SUPERADMIN | List all users |
| GET | /api/users/role/{role} | HOD,FACILITATOR,SUPERADMIN | Filter by role |
| GET | /api/users/examiners | HOD,FACILITATOR,SUPERADMIN | Eligible examiners |
| POST | /api/users | SUPERADMIN | Create user |
| PATCH | /api/users/{id}/enabled | SUPERADMIN | Enable/disable |
| POST | /api/users/{id}/reset-password | SUPERADMIN | Reset password |

### Students
| Method | Path | Role | Description |
|---|---|---|---|
| GET | /api/students | HOD,FACILITATOR,SUPERADMIN | List all |
| GET | /api/students/{id} | HOD,FACILITATOR,SUPERADMIN,SUPERVISOR | Get by ID |
| GET | /api/students/state/{state} | HOD,FACILITATOR,SUPERADMIN | Filter by state |
| POST | /api/students/import | HOD,FACILITATOR,SUPERADMIN | Excel import |
| POST | /api/students/{id}/assign-supervisor | HOD,FACILITATOR,SUPERADMIN | Assign supervisor |
| POST | /api/students/{id}/transition | (role-checked in service) | Change state |
| PATCH | /api/students/{id}/sign-off-book | SUPERVISOR | Mark book signed |
| PATCH | /api/students/{id}/flag | HOD,FACILITATOR,SUPERADMIN | Flag student |
| POST | /api/students/{id}/withdraw | HOD,FACILITATOR,SUPERADMIN | Withdraw student |

### Proposals
| Method | Path | Role | Description |
|---|---|---|---|
| POST | /api/proposals/{studentId}/submit | STUDENT,HOD,FACILITATOR,SUPERADMIN | Submit proposal (from PROTOTYPE_GRANTED or PROPOSAL_UNDER_REVIEW) |
| POST | /api/proposals/{studentId}/review | HOD,FACILITATOR,SUPERADMIN | Accept or reject with reason; locks after 3 rejections |
| POST | /api/proposals/{studentId}/unlock | HOD,SUPERADMIN | Unlock submission after 3 rejections |
| GET | /api/proposals/{studentId}/history | all roles | Full proposal attempt history |

### Supervision
| Method | Path | Role | Description |
|---|---|---|---|
| POST | /api/supervision/slots | SUPERVISOR | Add availability slot |
| GET | /api/supervision/slots/me | SUPERVISOR | My slots |
| GET | /api/supervision/slots/{supervisorId} | HOD,FACILITATOR,SUPERADMIN,STUDENT | Supervisor's slots |
| DELETE | /api/supervision/slots/{slotId} | SUPERVISOR | Deactivate slot |
| POST | /api/supervision/meetings | SUPERVISOR | Schedule meeting |
| PATCH | /api/supervision/meetings/{id}/confirm | SUPERVISOR | Confirm meeting |
| PATCH | /api/supervision/meetings/{id}/outcome | SUPERVISOR | Record attendance/notes |
| GET | /api/supervision/meetings/me | SUPERVISOR | My meetings |
| GET | /api/supervision/meetings/student/{id} | SUPERVISOR,HOD,FACILITATOR,SUPERADMIN | Student's meetings |

---

## Excel Import Format

`POST /api/students/import` — multipart file, field name: `file`

Required columns (case-insensitive headers):
```
reg_number | full_name | email | phone | org | group
```

- `org` = organization/company for industry-based projects (nullable)
- `group` = WhatsApp group name/link (nullable)

---

## Database Migrations

Located at `backend/src/main/resources/db/migration/`

| File | Description |
|---|---|
| V1__init_schema.sql | All tables: users, students, state_transitions, meetings, panels, etc. |
| V2__seed_superadmin.sql | Seeds admin@aauca.ac.rw / Admin@1234 |

**Important**: Never edit a migration that has already been applied to a database. Add a new V3__ file instead. If you must edit an existing one during development, run `mvn flyway:repair` to fix the checksum.

---

## Known Issues Fixed

- `@Builder.Default` required on all `Instant.now()` fields in entities — Lombok's `@Builder` ignores field initializers without it, causing NOT NULL violations
- `JwtAuthFilter` injects `UserRepository` directly (not `UserDetailsService`) to avoid circular dependency with `SecurityConfig`
- Spring mail health check disabled in `application.yml` (no SMTP creds in dev)
- BCrypt hash in V2 seed was invalid — replaced with a verified `$2b$12$` hash

---

## Development Plan

### Phase 1 — Backend Foundation ✅ COMPLETE & VERIFIED
All tests pass: health, login, auth enforcement, user CRUD, student list, state machine error handling.

### Phase 2 — Backend Features (IN PROGRESS)
- **2a** Supervision module (slots + meetings) ✅ Built, pushed
- **2b** Proposal module — submit, accept/reject with reason, 3-attempt limit ✅ Built
- **2c** Panel assignment — pre-defense/defense panels, no supervisor as own examiner
- **2d** Email notifications — on state transitions + milestone reminders
- **2e** Audit + notification log query endpoints

### Phase 3 — Frontend Integration
- Wire login to real `/api/auth/login`
- Replace mock data (`fypData.ts`) with real API calls
- Role-based routing and views

### Phase 4 — Testing & Hardening
- Integration tests for state machine
- End-to-end smoke test

---

## Important Notes for Claude Code

- All commits must be authored as `Jean-Luc-of-God <kwizerajeanluc30@gmail.com>`
- Never push to `main` — only to `claude/inspiring-wright-jyjnjb`
- Never commit `.env` — it is gitignored
- Test every feature before marking it done — run curl tests against the live server
- If you edit a Flyway migration that was already applied, run `mvn flyway:repair`
- The frontend still uses mock data — do not connect it until Phase 2 is fully complete
