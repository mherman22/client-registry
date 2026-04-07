# Open Client Registry (OpenCR)

[![Build OpenCR Image](https://github.com/mherman22/client-registry/actions/workflows/build-opencr.yml/badge.svg)](https://github.com/mherman22/client-registry/actions/workflows/build-opencr.yml)

A standards-based, open-source **Master Patient Index (MPI)** and Client Registry for Health Information Exchanges. OpenCR assigns unique identifiers to patients, deduplicates records across facilities, and enables patient lookup via FHIR-based APIs.

This is a maintained fork of [intrahealth/client-registry](https://github.com/intrahealth/client-registry) with bug fixes, UI modernization, and OpenHIE compliance improvements.

---

## What does OpenCR do?

- **Assign and look up unique patient identifiers** across facilities
- **Deduplicate patients** using configurable matching rules (deterministic + probabilistic)
- **Accept patient submissions** from any FHIR-capable system (EMRs, lab systems, etc.)
- **Provide a UI (CRUX)** for manual adjudication of uncertain matches
- **Maintain a full audit trail** of all patient record changes

> OpenCR is a **Client Registry** — it manages patient identities and identifiers. It is not a Shared Health Record and does not store clinical data.

---

## Quick Start

### Docker Compose (standalone)

```bash
git clone https://github.com/mherman22/client-registry.git
cd client-registry

# Start OpenCR + HAPI FHIR + Elasticsearch
docker compose up -d

# Access the CRUX UI
open https://localhost:3000/crux/#/login
# Default credentials: root@intrahealth.org / intrahealth
```

### Docker Image (GHCR)

```bash
docker pull ghcr.io/mherman22/client-registry:improved-opencr-fork
```

The image expects a `config_docker.json` mounted at `/src/server/config/config_docker.json`. See [Configuration](#configuration) for details.

---

## Configuration

OpenCR is configured via JSON files, typically mounted as Docker volumes.

### config.json (main configuration)

Mounted at `/src/server/config/config_docker.json` (when `NODE_ENV=docker`).

```json
{
  "app": { "port": 3000, "installed": false },
  "mediator": {
    "api": {
      "username": "root@openhim.org",
      "password": "your-password",
      "apiURL": "https://openhim-core:8080",
      "trustSelfSigned": true
    },
    "register": true
  },
  "fhirServer": {
    "username": "hapi",
    "password": "hapi",
    "baseURL": "http://opencr-fhir:8080/fhir"
  },
  "elastic": {
    "server": "http://es:9200",
    "index": "patients"
  },
  "codes": {
    "goldenRecord": "5c827da5-4858-4f3d-a50c-62ece001efea"
  },
  "clients": [
    { "id": "openmrs", "displayName": "OpenMRS" },
    { "id": "openelis", "displayName": "OpenELIS" }
  ],
  "systems": {
    "internalid": {
      "uri": ["http://example.org/openmrs/fhir2/3-patient-id"],
      "displayName": "Internal ID"
    }
  }
}
```

Key sections:
| Section | Purpose |
|---------|---------|
| `app.installed` | Set to `false` on first run to trigger setup |
| `mediator` | OpenHIM mediator registration. Set `register: false` if not using OpenHIM |
| `fhirServer` | HAPI FHIR connection for patient storage |
| `elastic` | Elasticsearch connection for patient matching |
| `clients` | Source systems — shown as "Point of Service" in the CRUX UI. The client ID comes from the `x-openhim-clientid` HTTP header |
| `systems` | Identifier system URI → display name mapping. `internalid` is special — patients must have at least one identifier from this list to be accepted |

### decisionRules.json (matching rules)

Configurable patient matching rules. Supports:
- **Deterministic matching**: exact field comparison
- **Probabilistic matching**: Jaro-Winkler, Levenshtein, Damerau-Levenshtein with configurable thresholds

```json
{
  "rules": [
    {
      "__description": "National ID exact match",
      "matchingType": "deterministic",
      "fields": {
        "nationalId": {
          "algorithm": "exact",
          "fhirpath": "identifier.where(system='http://example.org/national-id').value",
          "espath": "nationalId"
        }
      },
      "potentialMatchThreshold": 2,
      "autoMatchThreshold": 2
    }
  ]
}
```

**Important:** The `espath` value must match the Elasticsearch field name exactly (case-sensitive). These field names come from `PatientRelationship.json`.

### PatientRelationship.json (Elasticsearch indexing)

Defines which patient fields are indexed in Elasticsearch and how they're extracted via FHIRPath:

```json
{
  "extension": [
    {
      "extension": [
        { "url": "label", "valueString": "given" },
        { "url": "name", "valueString": "name.first().given" }
      ]
    }
  ]
}
```

The `label` becomes the Elasticsearch field name. The `name` is the FHIRPath expression used to extract the value from the Patient resource.

> **Note:** If your source system doesn't set `name.use='official'`, use `name.first().family` instead of `name.where(use='official').family`.

---

## CRUX UI

The CRUX web interface provides:

- **Patient search** with facility filtering
- **Patient detail** with demographics, identifiers, and linked records
- **Match adjudication** — review and resolve uncertain matches
- **Auto-match review** — review automatically linked records
- **Audit log** — full trail of patient record changes (CRF-8)
- **User management** with role-based access

Access at `https://<host>:<port>/crux/#/login`

---

## API Endpoints

### Patient Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/fhir/Patient` | Submit a patient (triggers matching) |
| GET | `/fhir/Patient/:id` | Get patient by ID |
| GET | `/fhir/Patient?identifier=system\|value` | Search by identifier |
| GET | `/fhir/Patient?name=...&gender=...` | Search by demographics |
| POST | `/fhir` | Submit a FHIR Bundle of patients |

### PIXm (Patient Identifier Cross-Reference)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/fhir/Patient/$ihe-pix?identifier=system\|value` | Cross-reference lookup |

### Match Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ocrux/match/count-match-issues` | Count flagged matches |
| GET | `/ocrux/match/get-match-issues` | List flagged matches |
| POST | `/ocrux/match/break-match` | Break a match link |
| POST | `/ocrux/match/resolve-match-issue` | Resolve a flagged match |

---

## OpenHIE Compliance

This fork addresses the following [OpenHIE Client Registry specifications](https://guides.ohie.org/arch-spec/openhie-component-specifications-1/client-registry):

| Requirement | Status | Notes |
|-------------|--------|-------|
| CRWF-1: Create patient | Done | POST /fhir/Patient |
| CRWF-2: Update patient | Done | PUT /fhir/Patient/:id |
| CRWF-3: Query by identifier | Done | PIXm support (fixed #19, #65) |
| CRWF-4: Query by demographics | Done | Name, gender, DOB search |
| CRF-1: Configurable matching | Done | JSON-based rules, deterministic + probabilistic |
| CRF-2: Patient linking/dedup | Done | Golden record creation, manual adjudication |
| CRF-5: Manual adjudication UI | Done | CRUX Review + AutoMatches views |
| CRF-7: Error management | Improved | Null checks, graceful failures (#153, #68) |
| CRF-8: Audit log | Done | AuditEvent view in CRUX UI |
| CRF-9: User management | Done | Users view with roles |
| CRF-10: Multi-birth | Done | multipleBirthBoolean/Integer display |

---

## Changes from Upstream

This fork includes fixes and improvements over [intrahealth/client-registry](https://github.com/intrahealth/client-registry):

### Bug Fixes
- **Fix crash when resource.link is undefined** during match processing ([#155](https://github.com/intrahealth/client-registry/pull/155))
- **Fix incorrect 500 status** on bundle POST with only Patient resources ([#156](https://github.com/intrahealth/client-registry/pull/156))
- **Handle read-only config files** gracefully in Docker Swarm/Kubernetes ([#157](https://github.com/intrahealth/client-registry/pull/157))
- **Handle read-only relationship file** in prerequisites.js — prevents crash on EROFS
- **Fix prerequisites.js crash** on FHIR server connection error (null response handling)
- **Fix PIXm targetId** — use `entry.fullUrl` not `entry.resource.fullUrl` ([#148](https://github.com/intrahealth/client-registry/pull/148))
- **Fix search filter ternary precedence** in Home.vue ([#158](https://github.com/intrahealth/client-registry/pull/158))
- **Remove hardcoded UUID** from Client.vue ([#159](https://github.com/intrahealth/client-registry/pull/159))

### Features
- **Return FHIR Bundle** with auto and potential matches on POST /matches ([#137](https://github.com/intrahealth/client-registry/pull/137))
- **Audit Log view** — full audit trail UI (OpenHIE CRF-8)
- **Multi-birth indicator** display in patient detail (OpenHIE CRF-10)
- **Name display fallback** — shows first name when `use='official'` is not set
- **Identifier label fallback** — uses `identifier.type.text` when system URI has no config mapping
- **Address display** in patient detail
- **i18n** — English + French translations for audit log

### UI Modernization
- Modern healthcare design with clean colors, proper spacing, rounded cards
- Clean data tables with hover states and uppercase headers
- Page headers with subtitles
- Custom empty states with icons
- Color-coded status chips for match types

---

## Development

### Prerequisites
- Node.js 16+ (server) / 18+ (UI build)
- Docker & Docker Compose

### Local Development

```bash
# Install server dependencies
cd server && npm install

# Install UI dependencies
cd ../ui && npm install

# Run UI dev server (with hot reload)
npm run dev

# Run server
cd ../server && NODE_ENV=docker node lib/app.js
```

### Building the Docker Image

```bash
docker build -f Dockerfile.ci -t opencr:local .
```

### Running Tests

```bash
cd server && npm test
```

---

## License

[Apache License 2.0](LICENSE)

---

## Acknowledgments

OpenCR was originally developed by [IntraHealth International](https://www.intrahealth.org/) with support from PEPFAR through the USAID MEASURE Evaluation Project. Technical direction was provided by CDC.
