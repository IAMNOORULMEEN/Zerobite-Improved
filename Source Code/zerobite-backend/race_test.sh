#!/usr/bin/env bash
# race_test.sh — Verify the atomic claiming fix in ZeroBite
# Run with:  bash race_test.sh
#
# Uses Bash, not Fish, so it can run on any machine.
# Requires the backend to be running at http://127.0.0.1:8000

set -e

BASE="http://127.0.0.1:8000/api"
TIMESTAMP=$(date +%s)

echo "════════════════════════════════════════════════════════"
echo "  ZeroBite — Race Condition Test (Feature 3)"
echo "════════════════════════════════════════════════════════"
echo

# ─── 1. Register two NGO users ───────────────────────────
NGO_A="ngo_a_$TIMESTAMP"
NGO_B="ngo_b_$TIMESTAMP"
PASS="TestPass123!"

echo "[1/6] Registering NGO A: $NGO_A"
REG_A=$(curl -s -w "\n%{http_code}" -X POST "$BASE/register/" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$NGO_A\",\"email\":\"$NGO_A@example.com\",\"password\":\"$PASS\",\"role\":\"ngo\"}")
CODE_REG_A=$(echo "$REG_A" | tail -n 1)
if [ "$CODE_REG_A" != "201" ]; then
  echo "   ❌ Registration failed (HTTP $CODE_REG_A):"
  echo "$REG_A" | head -n -1
  exit 1
fi
echo "   ✅ Created"

echo "[2/6] Registering NGO B: $NGO_B"
REG_B=$(curl -s -w "\n%{http_code}" -X POST "$BASE/register/" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$NGO_B\",\"email\":\"$NGO_B@example.com\",\"password\":\"$PASS\",\"role\":\"ngo\"}")
CODE_REG_B=$(echo "$REG_B" | tail -n 1)
if [ "$CODE_REG_B" != "201" ]; then
  echo "   ❌ Registration failed (HTTP $CODE_REG_B):"
  echo "$REG_B" | head -n -1
  exit 1
fi
echo "   ✅ Created"

# ─── 2. Log in as both NGOs, grab tokens ─────────────────
echo
echo "[3/6] Logging in both NGOs"

# FIXED: Use python -c to parse JSON reliably (no grep -P dependency)
TOKEN_A=$(curl -s -X POST "$BASE/login/" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$NGO_A\",\"password\":\"$PASS\"}" \
  | python -c "import sys,json;print(json.load(sys.stdin).get('access',''))" 2>/dev/null || echo "")

TOKEN_B=$(curl -s -X POST "$BASE/login/" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$NGO_B\",\"password\":\"$PASS\"}" \
  | python -c "import sys,json;print(json.load(sys.stdin).get('access',''))" 2>/dev/null || echo "")

if [ -z "$TOKEN_A" ] || [ -z "$TOKEN_B" ]; then
  echo "❌ Failed to obtain tokens. Check that /api/login/ works."
  exit 1
fi
echo "   Token A: ${TOKEN_A:0:20}..."
echo "   Token B: ${TOKEN_B:0:20}..."

# ─── 3. Log in as superuser (donor) ──────────────────────
echo
echo "[4/6] Logging in as donor (superuser 'root')"
read -rp "   Enter superuser password: " ROOT_PASS
TOKEN_DONOR=$(curl -s -X POST "$BASE/login/" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"root\",\"password\":\"$ROOT_PASS\"}" \
  | python -c "import sys,json;print(json.load(sys.stdin).get('access',''))" 2>/dev/null || echo "")

if [ -z "$TOKEN_DONOR" ]; then
  echo "❌ Failed to log in as root. Wrong password?"
  exit 1
fi
echo "   Donor token acquired."

# ─── 4. Create a donation ────────────────────────────────
echo
echo "[5/6] Creating a test donation"
FUTURE=$(date -u -d '+1 hour' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v+1H +%Y-%m-%dT%H:%M:%SZ)

DONATION_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/donations/" \
  -H "Authorization: Bearer $TOKEN_DONOR" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Race Test Meal\",\"description\":\"Feature 3 test\",\"quantity\":1,\"location\":\"Test Kitchen\",\"expiry_time\":\"$FUTURE\"}")

CODE_DONATION=$(echo "$DONATION_RESP" | tail -n 1)
DONATION_JSON=$(echo "$DONATION_RESP" | head -n -1)

if [ "$CODE_DONATION" != "201" ]; then
  echo "   ❌ Donation creation failed (HTTP $CODE_DONATION):"
  echo "$DONATION_JSON"
  exit 1
fi

# FIXED: parse donation id via python
DONATION_ID=$(echo "$DONATION_JSON" | python -c "import sys,json;print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

if [ -z "$DONATION_ID" ]; then
  echo "❌ Failed to extract donation id. Response:"
  echo "$DONATION_JSON"
  exit 1
fi
echo "   ✅ Donation created with id=$DONATION_ID"

# ─── 5. THE RACE: fire both claims in parallel ───────────
echo
echo "[6/6] FIRING TWO PARALLEL CLAIMS at /donations/$DONATION_ID/claim/"
echo "────────────────────────────────────────────────────────"

# Two curl requests, launched simultaneously with '&'
# Each writes its HTTP status code and body to a temp file.
curl -s -o /tmp/race_a.body -w "%{http_code}" \
  -X PATCH "$BASE/donations/$DONATION_ID/claim/" \
  -H "Authorization: Bearer $TOKEN_A" \
  > /tmp/race_a.code &

curl -s -o /tmp/race_b.body -w "%{http_code}" \
  -X PATCH "$BASE/donations/$DONATION_ID/claim/" \
  -H "Authorization: Bearer $TOKEN_B" \
  > /tmp/race_b.code &

wait  # Wait for both to finish

CODE_A=$(cat /tmp/race_a.code | tr -d '[:space:]')
CODE_B=$(cat /tmp/race_b.code | tr -d '[:space:]')

echo
echo "  NGO A → HTTP $CODE_A"
echo "  NGO B → HTTP $CODE_B"
echo

# ─── 6. Verdict ──────────────────────────────────────────
SUCCESS_COUNT=0
[ "$CODE_A" = "200" ] && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
[ "$CODE_B" = "200" ] && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

echo "════════════════════════════════════════════════════════"
if [ "$SUCCESS_COUNT" -eq 1 ]; then
  echo "  ✅ PASS — exactly one claim succeeded"
  echo "     The row lock worked. Feature 3 is verified."
elif [ "$SUCCESS_COUNT" -eq 0 ]; then
  echo "  ⚠️  NEITHER claim succeeded"
  echo "     Both returned an error. Inspect bodies:"
  echo "     NGO A body: $(cat /tmp/race_a.body)"
  echo "     NGO B body: $(cat /tmp/race_b.body)"
elif [ "$SUCCESS_COUNT" -eq 2 ]; then
  echo "  ❌ FAIL — BOTH claims succeeded"
  echo "     The race condition is NOT fixed."
  echo "     Feature 3 needs revisiting."
fi
echo "════════════════════════════════════════════════════════"
echo

# ─── 7. Verify DB state ──────────────────────────────────
echo "DB state for donation id=$DONATION_ID:"
mariadb -u zerobite -p'zerobite_pass' zerobite_db \
  -e "SELECT id, is_claimed, claimed_by_id, claimed_at FROM donations_donation WHERE id=$DONATION_ID;" 
echo
echo "Should show: is_claimed=1, claimed_by_id=<one of the two NGOs>, claimed_at=<timestamp>"