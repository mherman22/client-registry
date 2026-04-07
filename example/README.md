# OpenCR Example Setup

A ready-to-run Docker Compose setup for OpenCR with HAPI FHIR and Elasticsearch.

## Quick Start

```bash
cd example
docker compose up -d

# Wait ~30s for services to be healthy, then access:
# OpenCR CRUX UI: https://localhost:3000/crux/#/login
# Credentials:    root@intrahealth.org / intrahealth
# HAPI FHIR:      http://localhost:8080/fhir
# Elasticsearch:  http://localhost:9200
```

## Development (UI hot reload)

Run the backend with Docker, and the UI dev server with Vite:

```bash
# Terminal 1 — start backend
cd example
docker compose up -d

# Terminal 2 — start UI dev server
cd ../ui
npm install
OPENCR_BACKEND=https://localhost:3000 npm run dev

# Open http://localhost:5173/crux/#/login
```

## Configuration

Edit files in `config/` to customize:

| File | Purpose |
|------|---------|
| `config.json` | Main config: FHIR server, ES, mediator, clients, identifier systems |
| `decisionRules.json` | Patient matching rules (deterministic + probabilistic) |
| `PatientRelationship.json` | Elasticsearch field indexing (FHIRPath → ES field mapping) |
| `mediator.json` | OpenHIM mediator registration (set `register: false` if no OpenHIM) |

After changing configs, restart OpenCR:

```bash
docker compose restart opencr
```

## Reset

```bash
docker compose down -v
# Set "installed": false in config/config.json
docker compose up -d
```
