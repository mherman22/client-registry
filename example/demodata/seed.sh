#!/bin/bash
# Seed OpenCR with demo patient data for development/testing
# Usage: ./seed.sh [OPENCR_URL]
#
# This script:
# - Loads 10 patients from patients.json into OpenCR
# - Includes patients from multiple sources (OpenMRS, OpenELIS)
# - Two patients share the same National ID (Jean Baptiste) to trigger matching
# - Two patients have multi-birth indicators
# - All patients have Haiti demographics

OPENCR_URL="${1:-https://localhost:3000}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PATIENTS_FILE="${SCRIPT_DIR}/patients.json"

echo "Seeding OpenCR at ${OPENCR_URL} with demo data..."
echo ""

# Wait for OpenCR to be ready
echo "Checking if OpenCR is ready..."
for i in $(seq 1 30); do
  if curl -sf -k "${OPENCR_URL}/ocrux/user/authenticate" -X POST -d "username=root@intrahealth.org&password=intrahealth" > /dev/null 2>&1; then
    echo "OpenCR is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "ERROR: OpenCR not responding after 5 minutes"
    exit 1
  fi
  echo "  Waiting... (${i}/30)"
  sleep 10
done

echo ""

# Get auth token
TOKEN=$(curl -sf -k "${OPENCR_URL}/ocrux/user/authenticate" -X POST \
  -d "username=root@intrahealth.org&password=intrahealth" 2>/dev/null | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "WARNING: Could not get auth token, trying without auth..."
fi

# Load patients
COUNT=$(python3 -c "import json; print(len(json.load(open('${PATIENTS_FILE}'))))" 2>/dev/null)
echo "Loading ${COUNT} patients..."
echo ""

SUCCESS=0
FAIL=0

python3 -c "
import json, sys
patients = json.load(open('${PATIENTS_FILE}'))
for p in patients:
    print(json.dumps(p))
" | while IFS= read -r patient; do
  NAME=$(echo "$patient" | python3 -c "import sys,json; p=json.load(sys.stdin); n=p.get('name',[{}])[0]; print(f\"{' '.join(n.get('given',[]))} {n.get('family','')}\")" 2>/dev/null)

  RESPONSE=$(curl -sf -k -X POST "${OPENCR_URL}/fhir/Patient" \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "$patient" 2>&1)

  if [ $? -eq 0 ]; then
    echo "  ✓ ${NAME}"
  else
    echo "  ✗ ${NAME} — failed"
  fi
done

echo ""
echo "Done! Open the CRUX UI to see the demo data."
echo ""
echo "Demo data includes:"
echo "  - 10 patients from Haiti"
echo "  - 2 patients share National ID NAT-88001 (Jean Baptiste) → should auto-match"
echo "  - 2 patients share National ID NAT-88002 (Marie Dupont) → should auto-match"
echo "  - 2 patients have multi-birth indicators"
echo "  - Patients from OpenMRS and OpenELIS sources"
echo "  - Various cities across Haiti departments"
