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

# Wait for OpenCR to be ready (auth must return a valid token)
echo "Checking if OpenCR is ready..."
for i in $(seq 1 30); do
  AUTH_RESPONSE=$(curl -sf -k "${OPENCR_URL}/ocrux/user/authenticate?username=root@intrahealth.org&password=intrahealth" -X POST 2>/dev/null)
  TOKEN=$(echo "$AUTH_RESPONSE" | python3 -c "import sys,json; t=json.load(sys.stdin).get('token',''); print(t if t else '')" 2>/dev/null)
  if [ -n "$TOKEN" ]; then
    echo "OpenCR is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "ERROR: OpenCR not responding with valid auth after 5 minutes"
    exit 1
  fi
  echo "  Waiting... (${i}/30)"
  sleep 10
done

echo ""

if [ -z "$TOKEN" ]; then
  echo "WARNING: Could not get auth token, trying without auth..."
fi

# Load patients via bundle endpoint
COUNT=$(python3 -c "import json; print(len(json.load(open('${PATIENTS_FILE}'))))" 2>/dev/null)
echo "Loading ${COUNT} patients..."
echo ""

python3 -c "
import json, sys

patients = json.load(open('${PATIENTS_FILE}'))
for i, p in enumerate(patients):
    pid = p.get('identifier', [{}])[0].get('value', f'demo-{i}')
    bundle = {
        'resourceType': 'Bundle',
        'type': 'transaction',
        'entry': [{
            'resource': p,
            'request': {
                'method': 'PUT',
                'url': f'Patient/{pid}'
            }
        }]
    }
    name_parts = p.get('name', [{}])[0]
    given = ' '.join(name_parts.get('given', []))
    family = name_parts.get('family', '')
    print(json.dumps({'bundle': bundle, 'name': f'{given} {family}'}))
" | while IFS= read -r line; do
  NAME=$(echo "$line" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])" 2>/dev/null)
  BUNDLE=$(echo "$line" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['bundle']))" 2>/dev/null)

  RESPONSE=$(curl -sf -k -o /dev/null -w "%{http_code}" -X POST "${OPENCR_URL}/fhir/" \
    -H "Content-Type: application/fhir+json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "x-openhim-clientid: openmrs" \
    -d "$BUNDLE" 2>&1)

  if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "201" ]; then
    echo "  ✓ ${NAME}"
  else
    echo "  ✗ ${NAME} — HTTP ${RESPONSE}"
  fi

  # Small delay to allow ES indexing between patients
  sleep 1
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
