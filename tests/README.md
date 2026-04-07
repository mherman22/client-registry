# OpenCR Tests

## Quick Start

```bash
cd tests
npm install
OPENCR_URL=https://localhost:3002 npm test
```

## E2E Tests Only

End-to-end tests run against a live OpenCR instance. Set `OPENCR_URL` to
point at the server (defaults to `https://localhost:3000`).

```bash
OPENCR_URL=https://localhost:3002 npm run test:e2e
```

## Unit Tests Only

Unit tests mock all external dependencies and do not require a running server.

```bash
npm run test:unit
```

## Directory Layout

```
tests/
  setup.js              - Shared axios client, auth helpers, utilities
  fixtures/
    patients.json       - Sample FHIR Patient resources
    bundles.json        - Sample FHIR Bundle resources
  e2e/
    patient-create.test.js   - Create patient via POST /fhir/Patient
    patient-update.test.js   - Update patient via PUT /fhir/Patient/:id
    patient-query.test.js    - Query by identifier or demographics
    patient-match.test.js    - Auto-match and potential match workflows
    match-break.test.js      - Break and unbreak match links
    audit.test.js            - Verify AuditEvent creation
  unit/
    fhir-routes.test.js      - FHIR route handler unit tests
    match-routes.test.js     - Match route handler unit tests
  data/
    uganda-dataset.csv       - Matching accuracy benchmark data
```

## Test Data

Each e2e test generates unique identifiers at runtime so tests are
idempotent and do not collide when run in parallel or repeatedly against
the same server.
