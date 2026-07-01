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
3. **Proposal acceptance flow** — rejection and 3-attempt lock both tested and working. Acceptance not yet tested (planned next session).

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
| Migrations | Flyway — V1 through V7 applied |
| Cache / Blacklist | Redis 7 |
| Auth | Spring Security + JWT (jjwt **0.12.6**), BCrypt cost 12 |
| Rate limiting | Removed for development — `LoginRateLimiter.java` still exists but is not wired in |
| Email | Spring Mail (JavaMailSender) — Gmail SMTP port 465 SSL, IPv6 required |
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
| V7__add_requirements_and_proposal_files.sql | Adds requirements_file_name (students) + proposal_file_name (proposal_attempts) | Applied |

**Never edit an applied migration. Add V8__ for new changes.**

---

## Email Configuration (Gmail SMTP)

Gmail is configured via environment variables in `.env`. Critical notes:
- Port **465** with SSL (not 587 STARTTLS — Google blocks STARTTLS from this host's IPv4)
- Java must prefer IPv6: `System.setProperty("java.net.preferIPv6Addresses", "true")` in `MailConfig.java` AND `<jvmArguments>` in `pom.xml`
- Use a Gmail App Password (16 chars, no spaces) — not the Gmail account password
- `MailConfig.java` creates a custom `JavaMailSenderImpl` bean with explicit smtps properties
- Required `.env` keys: `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `MAIL_PORT=465`

---

## OTP Password Reset Flow

Fully implemented and tested. User clicks "Forgot password" on login screen:
1. Enter email → `POST /api/auth/forgot-password` (public) → 6-digit OTP sent to their Gmail inbox
2. Enter OTP → `POST /api/auth/reset-password` with `{email, otp, newPassword}` (public)
3. OTP stored in Redis with 15-min TTL, deleted on first use (`otp:{email}` key)

**Key files:**
- `backend/src/main/java/rw/aauca/fyp/service/OtpService.java` — generates/validates OTP in Redis
- `backend/src/main/java/rw/aauca/fyp/config/MailConfig.java` — custom mail sender with IPv6 fix
- `frontend/src/components/Layout.tsx` — `LoginLauncher` has 3-step OTP flow built in

Both `/api/auth/forgot-password` and `/api/auth/reset-password` are listed as public in `SecurityConfig.java`.

---

## Security Features (all implemented)

- JWT auth with HMAC-SHA384, 24h expiry, blacklist on logout (Redis)
- BCrypt cost 12 for passwords
- **Login rate limiter removed** — `LoginRateLimiter.java` exists but `AuthController` no longer calls it (removed to allow unrestricted testing). Re-wire before production.
- Role-based access control via `@PreAuthorize` on all endpoints
- HTTP security headers: HSTS, X-Frame-Options, XSS Protection, Content-Type-Options
- `open-in-view: false` in application.yml
- CORS reads from `FRONTEND_URL` env var (allows localhost:* for dev + prod URL)

---

## Backend Package Structure

```
rw.aauca.fyp/
├── config/
│   ├── SecurityConfig.java             # CORS uses ${app.frontend-url} env var
│   └── MailConfig.java                 # Custom JavaMailSender with IPv6 + SSL fix
├── controller/
│   ├── AuthController.java             # /api/auth/login, logout, forgot-password, reset-password
│   ├── StudentController.java          # /api/students/**
│   ├── ProposalController.java         # /api/proposals/**
│   ├── PanelController.java            # /api/panels/**
│   ├── SupervisionController.java      # /api/supervision/**
│   └── UserController.java             # /api/users/**
├── security/
│   ├── JwtUtil.java                    # jjwt 0.12.6 API (verifyWith, parseSignedClaims)
│   ├── JwtAuthFilter.java              # reads Bearer token, checks blacklist
│   ├── JwtBlacklistService.java        # Redis-backed logout blacklist
│   └── LoginRateLimiter.java           # Bucket4j (exists but NOT wired in AuthController)
└── service/
    ├── AuthService.java                # login + OTP password reset
    ├── OtpService.java                 # Redis OTP store (15-min TTL, one-time use)
    ├── UserService.java
    ├── StudentService.java             # Excel import, file uploads (letter + requirements)
    ├── StudentStateService.java        # 13-state machine — the core
    ├── ProposalService.java            # 3-attempt limit, locking, file upload, Hibernate flush bug fixed
    ├── PanelService.java               # no supervisor as own examiner rule
    ├── SupervisionService.java         # slots + meetings
    ├── EmailService.java               # all notification methods + OTP email
    └── AuditService.java               # immutable audit log
```

---

## API Endpoints (all implemented)

### Auth
| Method | Path | Access |
|---|---|---|
| POST | /api/auth/login | public |
| POST | /api/auth/logout | authenticated — blacklists JWT |
| POST | /api/auth/forgot-password | public — sends OTP to email |
| POST | /api/auth/reset-password | public — validates OTP, sets new password |

### Users: /api/users/**
GET list, GET by role, GET examiners, POST create, PATCH enable/disable, POST reset-password

### Students: /api/students/**
GET list, GET by id, GET by state, POST import (Excel), POST assign-supervisor, POST transition, PATCH sign-off-book, PATCH flag, POST withdraw

**File endpoints:**
- `POST /api/students/me/submit-case-letter` — student submits letter + optional file
- `GET /api/students/me/letter-file` — student downloads their own case letter (STUDENT role)
- `GET /api/students/{id}/letter-file` — HOD/staff downloads student's case letter
- `POST /api/students/{id}/requirements-doc` — HOD uploads prototype requirements for a student
- `GET /api/students/{id}/requirements-doc` — HOD/staff downloads requirements doc
- `GET /api/students/me/requirements-doc` — student downloads their requirements doc (STUDENT role)

**File storage:** `uploads/case-letters/{studentId}/`, `uploads/requirements/{studentId}/`

### Proposals: /api/proposals/{studentId}/**
| Method | Path | Notes |
|---|---|---|
| POST | /submit | accepts optional `file` multipart param |
| POST | /review | HOD/Facilitator accepts or rejects with reason |
| POST | /unlock | HOD unlocks after 3 rejections |
| GET | /history | full attempt list |
| GET | /latest-file | authenticated blob download of most recent proposal PDF |

**File storage:** `uploads/proposals/{studentId}/attempt-{n}/`

### Panels: /api/panels/**
POST assign, PATCH outcome (auto-transitions state), DELETE, GET by student, GET /me (examiner)

### Supervision: /api/supervision/**
POST slots, GET slots/me, GET slots/{supervisorId}, DELETE slot, POST meetings, PATCH confirm, PATCH outcome, GET meetings/me, GET meetings/student/{id}

---

## Frontend Pages & Key Components

| Component | File | Notes |
|---|---|---|
| Login + OTP flow | `Layout.tsx` → `LoginLauncher` | 3-step: login / request-otp / enter-otp |
| Student dashboard | `StudentDashboard.tsx` | Case letter upload, proposal PDF upload, requirements download |
| HOD letter review | `HODDashboard.tsx` → `ReviewLetterModal` | Blob URL fetch (auth), optional requirements upload on approve |
| HOD proposal review | `HODDashboard.tsx` → `ProposalReview` | Blob URL PDF viewer, accept/reject, live badge on sidebar |
| HOD prototype review | `HODDashboard.tsx` → `ProtoReview` | Call in students, record outcome, grant prototype |

**Vite proxy:** `vite.config.ts` proxies `/api/*` → `http://localhost:9191` so raw `fetch('/api/...')` works.

**Token storage:** `localStorage` key `fyp_jwt`. Use `getToken()` from `frontend/src/api/client.ts`.

**Important:** iframes cannot send `Authorization` headers. All authenticated file endpoints must be fetched with `fetch()` + Bearer token, then rendered as `URL.createObjectURL(blob)`. This is already done in `ReviewLetterModal` and `ProposalReview`.

---

## Deployment Setup (ready, not yet deployed)

`render.yaml` is in the repo root. Planned stack:
- **Backend** → Render (free tier, root dir: `backend/`)
- **PostgreSQL** → Supabase (free)
- **Redis** → Upstash (free)
- **Frontend** → Vercel (free, root dir: `frontend/`, env var: `VITE_API_URL=<render url>`)

The backend reads `PORT` env var for the port (Render injects this). Redis password supported via `REDIS_PASSWORD` env var. CORS reads `FRONTEND_URL` env var.

**Before deploying:** re-enable the login rate limiter in `AuthController.java` (inject `LoginRateLimiter` and call `tryConsume(ip)`).

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
- `LazyInitializationException` on `GET /api/students/me` — fixed by adding `@EntityGraph(attributePaths = {"user", "supervisor"})` to ALL `StudentRepository` query methods
- Student case letter submit returned 500 — fixed: frontend always calls `updateMyDetails` before `submitCaseLetter`
- Frontend was showing mock data (fake supervisors, 40 fake students) — fixed: removed `buildMockStudents()`, bumped localStorage key from v1 to v2
- Gmail SMTP `Connection reset` on port 587/465 — fixed: Java defaults to IPv4 which Google blocks on this host. Solution: `System.setProperty("java.net.preferIPv6Addresses", "true")` in `MailConfig.java` + `<jvmArguments>` in `pom.xml`
- iframes do not send `Authorization` headers — HOD letter viewer and proposal viewer both fixed to use `fetch()` + `createObjectURL(blob)` instead of bare iframe src
- `proposalsApi` not imported in `HODDashboard.tsx` — caused runtime crash on proposal reject. Fixed by adding import.
- Login rate limiter (Bucket4j) was blocking testing after 5 attempts — removed from `AuthController` (class still exists, not wired in)

---

## Important Notes

- Maven binary: `/opt/idea-IU-261.25134.95/plugins/maven/lib/maven3/bin/mvn`
- Backend port: **9191** (not 8080 — something else runs on 8080)
- Always `export $(grep -v '^#' ../.env | xargs)` before running Maven — Spring Boot does not auto-read `.env` files
- If Flyway fails with "more than one migration with version X", check `target/classes/db/migration/` for stale files from old builds and delete them, then restart
- The `.env` file exists and has valid values for JWT, DB, Redis, and Gmail SMTP — it is gitignored and must never be committed
- `frontend/.env` sets `VITE_API_URL=http://localhost:9191` — this is gitignored too; recreate on a new machine
