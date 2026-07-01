# FYP Tracking & Accountability System — CLAUDE.md

This file is the single source of truth for Claude Code. Read the entire file before doing anything.

---

## Who Is the User

**MANISHIMWE KWIZERA Jean Luc** — final year Software Engineering student at AUCA (Adventist University of Central Africa), Kigali, Rwanda. Student ID: 26972. Supervisor: ISHIMWE M. Prince.

- Git identity: `Jean-Luc-of-God <kjeanluc312@gmail.com>` — EVERY commit must use this exactly, no Co-Authored-By, no other email
- GitHub repo: `Jean-Luc-of-God/fyp-tracking-system-`
- Active branch: `feature/fyp-tracking-system` — never push to `main`
- Never commit `.env`

---

## Where We Are Right Now (read this first)

### App Status: FULLY BUILT & TESTED ✅

The entire application — backend, frontend, tests — is complete and working. **45 tests pass** (7 integration + 23 unit state machine + 15 unit proposal). Login with `admin@aauca.ac.rw` / `Admin@1234`.

### Database: Docker (not local PostgreSQL)

PostgreSQL and Redis both run as Docker containers defined in `docker-compose.yml`. The local PostgreSQL 18 installation has a pg_hba.conf permission issue — do NOT use it. Always use Docker.

**To start everything from scratch:**
```bash
# 1. Start database and Redis
cd /home/manishimwe-kwizera-jean-luc/fyp-tracking-system-
docker compose up -d

# 2. Start backend
cd backend
export $(grep -v '^#' ../.env | xargs)
/opt/idea-IU-261.25134.95/plugins/maven/lib/maven3/bin/mvn spring-boot:run > /tmp/backend.log 2>&1 &

# 3. Start frontend
cd ../frontend
npm run dev > /tmp/frontend.log 2>&1 &
```

The Docker volume `fyp-tracking-system-_postgres_data` is persistent — data survives restarts. Only `docker compose down -v` deletes it (never do this unless intentional).

### Thesis Status: NEARLY COMPLETE ✅

Latest compiled file: **`/home/manishimwe-kwizera-jean-luc/Downloads/FYP_Report_FINAL.odt`**

| Section | Status |
|---|---|
| Chapter 1 — General Introduction | ✅ Done |
| Chapter 2 — Analysis of Existing System | ✅ Done |
| Chapter 3 — Requirements Analysis & Design | ✅ Done |
| Chapter 4 — Implementation | ✅ Done |
| Chapter 5 — Conclusion & Recommendations | ✅ Done |
| References / Bibliography | ✅ Written — see `references.md` in project root |
| Appendices | ✅ Added into FYP_Report_FINAL.odt |
| Figures 1–9 (UML/architecture diagrams) | ✅ Embedded |
| Figures 10–17 (UI screenshots) | ❌ Still needed — take from live app at localhost:5173 |

### What Is Still Left To Do

1. **UI Screenshots (Figures 10–17)** — take browser screenshots of the live app (login, dashboards, student import, panels, supervision, notifications) and insert into the ODT.
2. **Deployment** — app is ready to deploy. `render.yaml` is in the repo root. Plan: Render (backend) + Supabase (PostgreSQL) + Upstash (Redis) + Vercel (frontend). Accounts not yet created.

---

## Running Locally

### Maven location (no system-wide mvn)
```bash
/opt/idea-IU-261.25134.95/plugins/maven/lib/maven3/bin/mvn
```

### Start backend (must export .env first)
```bash
cd /home/manishimwe-kwizera-jean-luc/fyp-tracking-system-/backend
export $(grep -v '^#' ../.env | xargs)
/opt/idea-IU-261.25134.95/plugins/maven/lib/maven3/bin/mvn spring-boot:run > /tmp/backend.log 2>&1 &
# Wait for: curl http://localhost:9191/actuator/health → {"status":"UP"}
```

### Start frontend
```bash
cd /home/manishimwe-kwizera-jean-luc/fyp-tracking-system-/frontend
npm run dev
# Runs on http://localhost:5173
```

### Test login
```bash
curl -s -X POST http://localhost:9191/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aauca.ac.rw","password":"Admin@1234"}'
```

### Run tests
```bash
cd backend
export $(grep -v '^#' ../.env | xargs)
/opt/idea-IU-261.25134.95/plugins/maven/lib/maven3/bin/mvn test
# Expected: 45 tests, 0 failures
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3.2.5, Java 17 |
| ORM | Spring Data JPA + Hibernate |
| Database | PostgreSQL 16 — Docker container `fyp_postgres` (fyp_tracker / fyp_user / fyp_pass) |
| Migrations | Flyway — V1 through V6 applied |
| Cache / Blacklist | Redis 7 |
| Auth | Spring Security + JWT (jjwt **0.12.6**), BCrypt cost 12 |
| Rate limiting | Bucket4j 8.10.1 — 5 login attempts / IP / 15 min |
| Email | Spring Mail (JavaMailSender) |
| Excel import | Apache POI 5.2.5 |
| Frontend | React 19, TypeScript, Vite |
| Port | Backend: **9191** (not 8080) |

---

## Roles

```
STUDENT, SUPERVISOR, FACILITATOR, HOD, EXAMINER, SUPERADMIN
```

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

- `FLAGGED` is a boolean on the student record, not a state
- `WITHDRAWN` and `COMPLETED` are terminal
- Proposal locked after 3 rejections — HOD must unlock via `POST /api/proposals/{id}/unlock`
- Enforced in `StudentStateService.java` — invalid transitions throw `InvalidStateTransitionException`

---

## Default Login

| Email | Password | Role |
|---|---|---|
| admin@aauca.ac.rw | Admin@1234 | SUPERADMIN |

Password was reset by V5 migration. If login fails, restart the backend (Flyway runs V5 on startup and resets the hash).

---

## Database Migrations

Located at `backend/src/main/resources/db/migration/`

| File | Description | Status |
|---|---|---|
| V1__init_schema.sql | All 10 tables | Applied |
| V2__seed_superadmin.sql | Seeds admin user (ON CONFLICT DO NOTHING) | Applied |
| V3__add_proposal_locked.sql | Adds proposal_locked column | Applied |
| V4__add_letter_rejection_reason.sql | Adds rejection reason to case letters | Applied |
| V5__reset_superadmin_password.sql | Resets admin password via ON CONFLICT DO UPDATE | Applied |
| V6__add_letter_file_name.sql | Adds letter_file_name column to students table | Applied |

**Never edit an applied migration. Add V7__ for new changes.**

---

## Security Features (all implemented)

- JWT auth with HMAC-SHA384, 24h expiry, blacklist on logout (Redis)
- BCrypt cost 12 for passwords
- Login rate limit: 5 attempts / IP / 15 min (Bucket4j, in-memory)
- Role-based access control via `@PreAuthorize` on all endpoints
- HTTP security headers: HSTS, X-Frame-Options, XSS Protection, Content-Type-Options
- `open-in-view: false` in application.yml
- CORS reads from `FRONTEND_URL` env var (allows localhost:* for dev + prod URL)

---

## Backend Package Structure

```
rw.aauca.fyp/
├── config/SecurityConfig.java          # CORS uses ${app.frontend-url} env var
├── controller/
│   ├── AuthController.java             # POST /api/auth/login, POST /api/auth/logout
│   ├── StudentController.java          # /api/students/**
│   ├── ProposalController.java         # /api/proposals/**
│   ├── PanelController.java            # /api/panels/**
│   ├── SupervisionController.java      # /api/supervision/**
│   └── UserController.java             # /api/users/**
├── security/
│   ├── JwtUtil.java                    # jjwt 0.12.6 API (verifyWith, parseSignedClaims)
│   ├── JwtAuthFilter.java              # reads Bearer token, checks blacklist
│   ├── JwtBlacklistService.java        # Redis-backed logout blacklist
│   └── LoginRateLimiter.java           # Bucket4j, ConcurrentHashMap<IP, Bucket>
└── service/
    ├── AuthService.java
    ├── UserService.java
    ├── StudentService.java             # Excel import via Apache POI
    ├── StudentStateService.java        # 13-state machine — the core
    ├── ProposalService.java            # 3-attempt limit, locking, Hibernate flush bug fixed
    ├── PanelService.java               # no supervisor as own examiner rule
    ├── SupervisionService.java         # slots + meetings
    ├── EmailService.java               # all notification methods
    └── AuditService.java               # immutable audit log
```

---

## API Endpoints (all implemented)

### Auth
| POST | /api/auth/login | public |
| POST | /api/auth/logout | authenticated — blacklists JWT |

### Users: /api/users/**
GET list, GET by role, GET examiners, POST create, PATCH enable/disable, POST reset-password

### Students: /api/students/**
GET list, GET by id, GET by state, POST import (Excel), POST assign-supervisor, POST transition, PATCH sign-off-book, PATCH flag, POST withdraw

### Proposals: /api/proposals/{studentId}/**
POST submit, POST review (accept/reject), POST unlock, GET history

### Panels: /api/panels/**
POST assign, PATCH outcome (auto-transitions state), DELETE, GET by student, GET /me (examiner)

### Supervision: /api/supervision/**
POST slots, GET slots/me, GET slots/{supervisorId}, DELETE slot, POST meetings, PATCH confirm, PATCH outcome, GET meetings/me, GET meetings/student/{id}

---

## Deployment Setup (ready, not yet deployed)

`render.yaml` is in the repo root. Planned stack:
- **Backend** → Render (free tier, root dir: `backend/`)
- **PostgreSQL** → Supabase (free)
- **Redis** → Upstash (free)
- **Frontend** → Vercel (free, root dir: `frontend/`, env var: `VITE_API_URL=<render url>`)

The backend reads `PORT` env var for the port (Railway/Render inject this). Redis password supported via `REDIS_PASSWORD` env var. CORS reads `FRONTEND_URL` env var.

---

## Thesis Book — Full Status

### Files
- Compiled thesis: `/home/manishimwe-kwizera-jean-luc/Downloads/FYP_Report_FINAL.odt` — all chapters + appendix
- Source chapters: `chapter-01.md`, `chapter-02.md`, `chapter-03.md`, `chapter-05.md` in project root
- References: `references.md` in project root (real books + websites, APA format)
- Build script: `build_thesis.py` in project root
- Template: `Shema Hugues-25603 (1) (1).docx` (AUCA Faculty of IT format, in project root)
- LibreOffice is installed. Microsoft Word is NOT.

### Chapter & Section Status
| Section | Status |
|---|---|
| Chapter 1 — General Introduction | ✅ Done |
| Chapter 2 — Analysis of Existing System | ✅ Done |
| Chapter 3 — Requirements Analysis & Design | ✅ Done |
| Chapter 4 — Implementation | ✅ Done |
| Chapter 5 — Conclusion & Recommendations | ✅ Done |
| References / Bibliography | ✅ Done (`references.md`) |
| Appendices | ✅ Added into FYP_Report_FINAL.odt |
| Figures 1–9 (UML/architecture diagrams) | ✅ Embedded |
| Figures 10–17 (UI screenshots) | ❌ Still needed |

### Figures 10–17 (UI screenshots still needed)
Take browser screenshots of the live app at `http://localhost:5173` (login: admin@aauca.ac.rw / Admin@1234):
- Figure 10: Login page
- Figure 11: Superadmin dashboard / system overview
- Figure 12: User management (create user form)
- Figure 13: Student import (Excel upload)
- Figure 14: Student profile / timeline
- Figure 15: Supervision slots and meetings
- Figure 16: Panel / examiner assignment
- Figure 17: Notification logs

Save as `figures/Figure 10.png` through `figures/Figure 17.png`, then rerun `python3 build_thesis.py`.

---

## Known Issues Fixed (important for debugging)

- `@Builder.Default` required on Lombok entity fields with initializers — without it, `state` and `enabled` are null when using builder
- `JwtAuthFilter` injects `UserRepository` directly (not `UserDetailsService`) to avoid circular dependency
- Spring mail health check disabled in `application.yml`
- Proposal service: Hibernate FlushMode.AUTO flushes the dirty `attempt` before `countByStudentIdAndStatus` runs — count already includes current rejection, no `+1` needed. This was a production bug that was found and fixed.
- jjwt 0.12.6 API: use `verifyWith(key)`, `parseSignedClaims(token).getPayload()`, builder uses `id/subject/issuedAt/expiration` (not `setId/setSubject`)
- Testcontainers abandoned (Docker API version incompatibility) — integration tests use dev PostgreSQL with `@Transactional` rollback
- `LazyInitializationException` on `GET /api/students/me` — fixed 2026-07-01 by adding `@EntityGraph(attributePaths = {"user", "supervisor"})` to ALL `StudentRepository` query methods. Without this, accessing `student.getUser()` outside a transaction throws an exception.
- Student case letter submit returned 500 — fixed 2026-07-01: frontend now always calls `updateMyDetails` before `submitCaseLetter` so the backend always has the project topic and organisation saved.
- Frontend was showing mock data (fake supervisors, 40 fake students) — fixed 2026-07-01: removed `buildMockStudents()` from AppContext initial state, bumped localStorage key from v1 to v2 to clear old cache.
- Case letter file upload added 2026-07-01: `POST /api/students/me/submit-case-letter` now accepts optional `MultipartFile file`. Files saved to `uploads/case-letters/{studentId}/`. HOD downloads via `GET /api/students/{id}/letter-file`.

---

## Important Notes

- Maven binary: `/opt/idea-IU-261.25134.95/plugins/maven/lib/maven3/bin/mvn`
- Backend port: **9191** (not 8080 — something else runs on 8080)
- Always `export $(grep -v '^#' ../.env | xargs)` before running Maven — Spring Boot does not auto-read `.env` files
- If Flyway fails with "more than one migration with version X", check `target/classes/db/migration/` for stale files from old builds and delete them, then restart
- The `.env` file exists and has a valid `JWT_SECRET` (the placeholder value from `.env.example` is long enough for dev)
