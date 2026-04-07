# OpenCR Example Setup

A ready-to-run Docker Compose setup for OpenCR with HAPI FHIR and Elasticsearch.

## Quick Start (production image)

```bash
cd example
docker compose up -d

# Wait ~30s for services to be healthy, then access:
# OpenCR CRUX UI: https://localhost:3000/crux/#/login
# Credentials:    root@intrahealth.org / intrahealth
# HAPI FHIR:      http://localhost:8080/fhir
# Elasticsearch:  http://localhost:9200
```

## Development (full auto-reload)

Both the UI and backend auto-reload on file changes:

```bash
# Terminal 1 — start backend with nodemon (auto-restarts on server code changes)
cd example
docker compose -f docker-compose.dev.yml up -d

# Terminal 2 — start UI with Vite (hot reload on Vue/CSS changes)
cd ../ui
npm install
OPENCR_BACKEND=https://localhost:3000 npm run dev

# Open http://localhost:5173/crux/#/login
# Credentials: root@intrahealth.org / intrahealth
```

**What auto-reloads:**
- `ui/src/**/*.vue` — Vite hot module replacement (instant, no page refresh)
- `ui/src/**/*.js` — Vite HMR
- `ui/src/**/*.scss` — Vite HMR
- `server/lib/**/*.js` — nodemon restarts the server (~2s)
- `server/config/**/*.json` — nodemon restarts the server
- `example/config/*.json` — restart OpenCR: `docker compose -f docker-compose.dev.yml restart opencr`

## Configuration

Edit files in `config/` to customize:

| File | Purpose |
|------|---------|
| `config.json` | Main config: FHIR server, ES, mediator, clients, identifier systems |
| `decisionRules.json` | Patient matching rules (deterministic + probabilistic) |
| `PatientRelationship.json` | Elasticsearch field indexing (FHIRPath → ES field mapping) |
| `mediator.json` | OpenHIM mediator registration (set `register: false` if no OpenHIM) |

## Reset

```bash
docker compose -f docker-compose.dev.yml down -v
# Set "installed": false in config/config.json
docker compose -f docker-compose.dev.yml up -d
```

## Switching between dev and production

```bash
# Production (uses pre-built GHCR image)
docker compose up -d

# Development (mounts local source, auto-reload)
docker compose -f docker-compose.dev.yml up -d
```

Don't run both at the same time — they use the same ports.
