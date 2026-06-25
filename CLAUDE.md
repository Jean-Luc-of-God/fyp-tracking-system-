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

The entire application — backend, frontend, tests — is complete and working. **45 tests pass** (7 integration + 23 unit state machine + 15 unit proposal). The backend is currently running locally on `http://localhost:9191`. Login with `admin@aauca.ac.rw` / `Admin@1234`.

### Thesis Status: Chapters 1–5 Written ✅

The thesis report for this project has been written and compiled. The latest compiled file is:
- **`/home/manishimwe-kwizera-jean-luc/Downloads/FYP_Report_Chapters15_FORMATTED.docx`** — Chapters 1–5 complete
- **`/home/manishimwe-kwizera-jean-luc/Downloads/FYP_Report_Chapters15_FORMATTED.pdf`** — PDF version
- Source markdown: `chapter-01.md`, `chapter-02.md`, `chapter-03.md` (in project root), `chapter-05.md` (in project root)
- Chapter 4 was compiled into `FYP_Report_Chapters14_FORMATTED.docx` in Downloads and then Chapter 5 was appended

### What Is Still Left To Do

1. **Thesis diagrams** — Jean-Luc is generating HD diagrams at claude.ai/design using prompts from `/home/manishimwe-kwizera-jean-luc/Desktop/diagram-prompts.txt`. There are 9 UML/architecture diagrams (Figures 1–9) and 8 UI screenshots (Figures 10–17) that need to replace the `[Figure placeholder — ...]` text in the Word document. The diagrams need to be A4-sized (794×1123px portrait). When inserting diagrams into the docx, use python-docx.
2. **References / Bibliography** — not yet written. Will be added as a final section.
3. **Deployment** — app is ready to deploy. `render.yaml` is in the repo root. Plan: Render (backend) + Supabase (PostgreSQL) + Upstash (Redis) + Vercel (frontend). The user has not yet created accounts on these services.

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
| Database | PostgreSQL 16 (local: fyp_tracker, user: fyp_user) |
| Migrations | Flyway — V1 through V5 applied |
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

**Never edit an applied migration. Add V6__ for new changes.**

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
- Source chapters: `chapter-01.md`, `chapter-02.md`, `chapter-03.md`, `chapter-05.md` in project root
- Compiled book: `/home/manishimwe-kwizera-jean-luc/Downloads/FYP_Report_Chapters15_FORMATTED.docx`
- Template used: `Shema Hugues-25603 (1) (1).docx` (AUCA Faculty of IT format, in project root)
- To rebuild PDF: `soffice --headless -env:UserInstallation=file:///tmp/lo-profile --convert-to pdf <file.docx> --outdir <dir>`
- LibreOffice is installed. Microsoft Word is NOT.

### Chapter Status
| Chapter | Title | Status |
|---|---|---|
| 1 | General Introduction | ✅ Written & compiled |
| 2 | Analysis of Existing System | ✅ Written & compiled |
| 3 | Requirements Analysis & Design | ✅ Written & compiled |
| 4 | Implementation | ✅ Written & compiled |
| 5 | Conclusion & Recommendations | ✅ Written & compiled |
| References | Bibliography | ❌ Not yet written |
| Appendices | API list, test results | ❌ Not yet written |

### Diagrams (Figures 1–17) — IN PROGRESS
Jean-Luc is generating diagrams at claude.ai/design using prompts from:
`/home/manishimwe-kwizera-jean-luc/Desktop/diagram-prompts.txt`

**Key rule**: diagrams must be A4 portrait size (794×1123px at 96dpi) to fit in the thesis.

| Figure | Description | Status |
|---|---|---|
| 1 | Current system flowchart | Generating |
| 2 | Use case diagram | Generating |
| 3 | Class diagram | Generating |
| 4 | Login sequence diagram | Generating |
| 5 | State transition sequence diagram | Generating |
| 6 | Login activity diagram | Generating |
| 7 | Student journey activity diagram | Generating |
| 8 | Database schema (ER diagram) | Generating |
| 9 | System architecture diagram | Generating |
| 10–17 | UI screenshots from live app | Need browser screenshots |

For screenshots (Figures 10–17): app is live at `http://localhost:5173`. Login: admin@aauca.ac.rw / Admin@1234.

---

## Known Issues Fixed (important for debugging)

- `@Builder.Default` required on Lombok entity fields with initializers — without it, `state` and `enabled` are null when using builder
- `JwtAuthFilter` injects `UserRepository` directly (not `UserDetailsService`) to avoid circular dependency
- Spring mail health check disabled in `application.yml`
- Proposal service: Hibernate FlushMode.AUTO flushes the dirty `attempt` before `countByStudentIdAndStatus` runs — count already includes current rejection, no `+1` needed. This was a production bug that was found and fixed.
- jjwt 0.12.6 API: use `verifyWith(key)`, `parseSignedClaims(token).getPayload()`, builder uses `id/subject/issuedAt/expiration` (not `setId/setSubject`)
- Testcontainers abandoned (Docker API version incompatibility) — integration tests use dev PostgreSQL with `@Transactional` rollback

---

## Important Notes

- Maven binary: `/opt/idea-IU-261.25134.95/plugins/maven/lib/maven3/bin/mvn`
- Backend port: **9191** (not 8080 — something else runs on 8080)
- Always `export $(grep -v '^#' ../.env | xargs)` before running Maven — Spring Boot does not auto-read `.env` files
- If Flyway fails with "more than one migration with version X", check `target/classes/db/migration/` for stale files from old builds and delete them, then restart
- The `.env` file exists and has a valid `JWT_SECRET` (the placeholder value from `.env.example` is long enough for dev)
