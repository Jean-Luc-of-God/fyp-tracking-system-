#!/usr/bin/env bash
# End-to-end smoke test: walks a student through every state from REGISTERED → COMPLETED.
# Requires: curl, python3 with openpyxl
# Usage: ./scripts/smoke_test.sh [BASE_URL]
#   Default BASE_URL: http://localhost:9191

set -uo pipefail

BASE="${1:-http://localhost:9191}"
PASS=0; FAIL=0

# ── helpers ───────────────────────────────────────────────────────────────────

green() { printf '\033[32m✔  %s\033[0m\n' "$*"; }
red()   { printf '\033[31m✘  %s\033[0m\n' "$*"; }

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    green "$label"
    PASS=$((PASS + 1))
  else
    red "$label  (expected: $expected, got: $actual)"
    FAIL=$((FAIL + 1))
  fi
}

# curl -s (no -f) so 4xx/5xx responses don't kill the script
post()        { curl -s -X POST  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$2" "$BASE$1"; }
patch()       { curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$2" "$BASE$1"; }
get()         { curl -s          -H "Authorization: Bearer $TOKEN" "$BASE$1"; }
status_get()  { curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE$1"; }
status_post() { curl -s -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$2" "$BASE$1"; }

# ── 0. Health check ────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo "  FYP Tracking System — End-to-End Smoke Test"
echo "  Target: $BASE"
echo "════════════════════════════════════════════════"

HEALTH=$(curl -s "$BASE/actuator/health" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "DOWN")
assert_eq "Health check UP" "UP" "$HEALTH"

# ── 1. Login ───────────────────────────────────────────────────────────────────
echo ""
echo "── 1. Auth ──────────────────────────────────────"
LOGIN=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@aauca.ac.rw","password":"Admin@1234"}' "$BASE/api/auth/login")
TOKEN=$(echo "$LOGIN" | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")
ROLE=$(echo  "$LOGIN" | python3 -c "import json,sys; print(json.load(sys.stdin)['role'])"  2>/dev/null || echo "")
assert_eq "Login returns SUPERADMIN role" "SUPERADMIN" "$ROLE"

STATUS=$(status_get "/api/users")
assert_eq "JWT accepted on protected endpoint" "200" "$STATUS"

# ── 2. Create test users ───────────────────────────────────────────────────────
echo ""
echo "── 2. User setup ────────────────────────────────"
TS=$(date +%s)

SUP_RESP=$(post "/api/users" "{\"fullName\":\"Smoke Supervisor\",\"email\":\"smoke_sup_${TS}@aauca.ac.rw\",\"role\":\"SUPERVISOR\",\"password\":\"Test@1234\"}")
SUP_ID=$(echo "$SUP_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
assert_eq "Supervisor created" "true" "$( [ -n "$SUP_ID" ] && echo true || echo false )"

EXM_RESP=$(post "/api/users" "{\"fullName\":\"Smoke Examiner\",\"email\":\"smoke_exm_${TS}@aauca.ac.rw\",\"role\":\"EXAMINER\",\"password\":\"Test@1234\"}")
EXM_ID=$(echo "$EXM_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
assert_eq "Examiner created" "true" "$( [ -n "$EXM_ID" ] && echo true || echo false )"

# ── 3. Import student via Excel ────────────────────────────────────────────────
echo ""
echo "── 3. Student import ────────────────────────────"

STU_EMAIL="alice.smoke.${TS}@student.aauca.ac.rw"
XLSX=$(mktemp --suffix=.xlsx)
python3 - "$XLSX" "$TS" <<'PYEOF'
import sys, openpyxl
wb = openpyxl.Workbook(); ws = wb.active
ts = sys.argv[2]
ws.append(["reg_number","full_name","email","phone","org","group"])
ws.append(["SMK"+ts[-6:], "Alice Smoke "+ts[-6:], "alice.smoke."+ts+"@student.aauca.ac.rw", "+250780000001", "", ""])
wb.save(sys.argv[1])
PYEOF

IMPORT_RESP=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$XLSX;type=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" \
  "$BASE/api/students/import")
rm -f "$XLSX"

IMPORT_COUNT=$(echo "$IMPORT_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('imported',0))" 2>/dev/null || echo "0")
assert_eq "Imported 1 student" "1" "$IMPORT_COUNT"

# Find the student by their unique email
ALL_STU=$(get "/api/students")
STUDENT_ID=$(echo "$ALL_STU" | python3 -c "
import json,sys
students = json.load(sys.stdin)
match = next((s for s in students if s.get('email','') == '$STU_EMAIL'), {})
print(match.get('id',''))
" 2>/dev/null || echo "")
STUDENT_STATE=$(echo "$ALL_STU" | python3 -c "
import json,sys
students = json.load(sys.stdin)
match = next((s for s in students if s.get('email','') == '$STU_EMAIL'), {})
print(match.get('state',''))
" 2>/dev/null || echo "")
assert_eq "Student starts at REGISTERED" "REGISTERED" "$STUDENT_STATE"
assert_eq "Student ID retrieved" "true" "$( [ -n "$STUDENT_ID" ] && echo true || echo false )"

# ── 4. State machine: REGISTERED → PROPOSAL_ACCEPTED ─────────────────────────
echo ""
echo "── 4. State machine: pre-supervision ───────────"

transition() {
  local to="$1" label="${2:-→ $1}"
  local resp got
  resp=$(post "/api/students/$STUDENT_ID/transition" "{\"state\":\"$to\",\"note\":\"smoke test\"}")
  got=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin)['state'])" 2>/dev/null || echo "ERROR")
  assert_eq "Transition $label" "$to" "$got"
}

transition CASE_LETTER_SUBMITTED
transition CASE_LETTER_APPROVED
transition PROTOTYPE_REVIEW
transition PROTOTYPE_REVIEW "→ PROTOTYPE_REVIEW (re-present)"
transition PROTOTYPE_GRANTED

# Submit proposal → PROPOSAL_UNDER_REVIEW
PROP_RESP=$(post "/api/proposals/$STUDENT_ID/submit" "{}")
PROP_STATUS=$(echo "$PROP_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "ERROR")
assert_eq "Proposal submitted (PENDING)" "PENDING" "$PROP_STATUS"

STU_STATE=$(get "/api/students/$STUDENT_ID" | python3 -c "import json,sys; print(json.load(sys.stdin)['state'])" 2>/dev/null || echo "ERROR")
assert_eq "Student in PROPOSAL_UNDER_REVIEW" "PROPOSAL_UNDER_REVIEW" "$STU_STATE"

# Accept proposal → PROPOSAL_ACCEPTED
REV_RESP=$(post "/api/proposals/$STUDENT_ID/review" '{"decision":"ACCEPTED"}')
REV_STATUS=$(echo "$REV_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "ERROR")
assert_eq "Proposal accepted" "ACCEPTED" "$REV_STATUS"

STU_STATE=$(get "/api/students/$STUDENT_ID" | python3 -c "import json,sys; print(json.load(sys.stdin)['state'])" 2>/dev/null || echo "ERROR")
assert_eq "Student in PROPOSAL_ACCEPTED" "PROPOSAL_ACCEPTED" "$STU_STATE"

# ── 5. Assign supervisor (PROPOSAL_ACCEPTED → SUPERVISION) ────────────────────
echo ""
echo "── 5. Supervisor assignment → SUPERVISION ───────"

ASSIGN_RESP=$(post "/api/students/$STUDENT_ID/assign-supervisor" "{\"supervisorId\":\"$SUP_ID\"}")
ASSIGN_STATE=$(echo "$ASSIGN_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('state',''))"      2>/dev/null || echo "ERROR")
ASSIGNED_SUP=$(echo "$ASSIGN_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('supervisorId',''))" 2>/dev/null || echo "ERROR")
assert_eq "Supervisor assigned" "$SUP_ID" "$ASSIGNED_SUP"
assert_eq "Student transitioned to SUPERVISION" "SUPERVISION" "$ASSIGN_STATE"

transition BOOK_SUBMITTED
transition PRE_DEFENSE

# ── 6. Pre-defense panel ───────────────────────────────────────────────────────
echo ""
echo "── 6. Pre-defense panel ─────────────────────────"

PANEL_RESP=$(post "/api/panels/assign" "{\"studentId\":\"$STUDENT_ID\",\"examinerId\":\"$EXM_ID\",\"panelType\":\"PRE_DEFENSE\"}")
PANEL_ID=$(echo "$PANEL_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
assert_eq "PRE_DEFENSE examiner assigned" "true" "$( [ -n "$PANEL_ID" ] && echo true || echo false )"

OUTCOME_RESP=$(patch "/api/panels/$PANEL_ID/outcome" '{"outcome":"CLEARED","notes":"smoke clear"}')
OUTCOME=$(echo "$OUTCOME_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['outcome'])" 2>/dev/null || echo "ERROR")
assert_eq "PRE_DEFENSE outcome: CLEARED" "CLEARED" "$OUTCOME"

STU_STATE=$(get "/api/students/$STUDENT_ID" | python3 -c "import json,sys; print(json.load(sys.stdin)['state'])" 2>/dev/null || echo "ERROR")
assert_eq "Auto-transitioned to DEFENSE" "DEFENSE" "$STU_STATE"

# ── 7. Defense panel ───────────────────────────────────────────────────────────
echo ""
echo "── 7. Defense panel ─────────────────────────────"

DEF_RESP=$(post "/api/panels/assign" "{\"studentId\":\"$STUDENT_ID\",\"examinerId\":\"$EXM_ID\",\"panelType\":\"DEFENSE\"}")
DEF_PANEL_ID=$(echo "$DEF_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
assert_eq "DEFENSE examiner assigned" "true" "$( [ -n "$DEF_PANEL_ID" ] && echo true || echo false )"

DEF_OUT_RESP=$(patch "/api/panels/$DEF_PANEL_ID/outcome" '{"outcome":"PASSED","notes":"smoke pass"}')
DEF_OUTCOME=$(echo "$DEF_OUT_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['outcome'])" 2>/dev/null || echo "ERROR")
assert_eq "DEFENSE outcome: PASSED" "PASSED" "$DEF_OUTCOME"

STU_STATE=$(get "/api/students/$STUDENT_ID" | python3 -c "import json,sys; print(json.load(sys.stdin)['state'])" 2>/dev/null || echo "ERROR")
assert_eq "Auto-transitioned to COMPLETED" "COMPLETED" "$STU_STATE"

# ── 8. Terminal state enforcement ──────────────────────────────────────────────
echo ""
echo "── 8. Terminal state enforcement ────────────────"

BAD=$(status_post "/api/students/$STUDENT_ID/transition" '{"state":"DEFENSE","note":"should fail"}')
assert_eq "Transition from COMPLETED rejected (4xx)" "true" "$( [[ "${BAD:0:1}" == "4" ]] && echo true || echo false )"

BAD=$(status_post "/api/students/$STUDENT_ID/transition" '{"state":"WITHDRAWN","note":"should fail"}')
assert_eq "WITHDRAWN from COMPLETED rejected (4xx)" "true" "$( [[ "${BAD:0:1}" == "4" ]] && echo true || echo false )"

# ── 9. JWT blacklist (logout) ──────────────────────────────────────────────────
echo ""
echo "── 9. JWT blacklist (logout) ────────────────────"

LOGOUT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Authorization: Bearer $TOKEN" "$BASE/api/auth/logout")
assert_eq "Logout returns 204" "204" "$LOGOUT_STATUS"

AFTER=$(status_get "/api/users")
assert_eq "Blacklisted token rejected after logout (403)" "403" "$AFTER"

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
TOTAL=$((PASS + FAIL))
printf "  Results: \033[32m%d passed\033[0m, \033[31m%d failed\033[0m  (%d total)\n" "$PASS" "$FAIL" "$TOTAL"
echo "════════════════════════════════════════════════"
echo ""

[ "$FAIL" -eq 0 ]
