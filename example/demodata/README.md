# OpenCR Demo Data

Load 10 demo patients into OpenCR to demonstrate matching, golden records, and roaming care scenarios.

## Usage

Start the stack, then seed:

```bash
cd ui
npm run dev:full     # start backend + frontend
npm run dev:seed     # load demo patients via Newman
```

Or run Newman directly:

```bash
npx newman run example/demodata/OpenCR_Demo_Data.postman_collection.json \
  -e example/demodata/local.postman_environment.json \
  --insecure --delay-request 1000
```

To change the target URL:

```bash
npx newman run example/demodata/OpenCR_Demo_Data.postman_collection.json \
  --env-var "baseUrl=https://localhost:3000" \
  --insecure --delay-request 1000
```

## How Matching Works

OpenCR uses Elasticsearch to match patients. Each incoming patient is scored against existing records using configurable **decision rules** (`decisionRules.json`). Rules run independently — the first rule that produces a match wins.

### Scoring

| Type | How it scores | Example |
|------|--------------|---------|
| **Deterministic** | Each matching field adds 1 to the score (sum mode) | 1 field exact match = score 1 |
| **Probabilistic** | Fellegi-Sunter weighted sum of field similarities | 4 fields all matching = score ~4 |

### Thresholds (per rule)

Each rule defines two thresholds that determine the outcome:

```
score >= autoMatchThreshold           → AUTO-MATCH (linked automatically)
potentialMatchThreshold <= score < autoMatchThreshold  → POTENTIAL MATCH (needs human review)
score < potentialMatchThreshold       → NO MATCH (not returned by ES)
```

### Rule 1: National ID (Deterministic)

- **Fields**: `identifier.where(system='...nationalid').value` — exact match
- **Score**: 0 (different) or 1 (identical)
- **Thresholds**: `potentialMatchThreshold: 1`, `autoMatchThreshold: 1`
- **Result**: Exact National ID match → auto-match. No partial matching possible.

### Rule 2: Demographics (Probabilistic)

- **Fields**: given name (jaro-winkler 0.8), family name (jaro-winkler 0.8), gender (exact), birthDate (exact)
- **Thresholds**: `potentialMatchThreshold: 3`, `autoMatchThreshold: 4`
- **All 4 fields match exactly** → score ~4 → **auto-match**
- **3 fields match** (e.g. similar given name + exact family + exact gender + different DOB) → score ~3 → **potential match** (flagged for human review)
- **Less than 3** → no match

### Jaro-Winkler Similarity

Used for fuzzy name matching. The `threshold: 0.8` means a field must be at least 80% similar to count toward the score.

| Comparison | Jaro-Winkler Score | Passes 0.8? |
|-----------|-------------------|-------------|
| Jean / Jean | 1.0 | Yes |
| Jean Pierre / Jean P. | ~0.85 | Yes |
| Jean-Louis / Jean Pierre | ~0.82 | Yes (borderline) |
| Marie / Marcel | ~0.78 | No |
| Emmanuel / Jean | ~0.45 | No |

### Null Handling

- `conservative`: If either the source or target field is null/empty, the field scores 0 (no contribution to the match score). This prevents false matches when data is missing.

## Demo Scenarios

The demo data includes 10 patients across 7 scenarios that demonstrate all matching outcomes:

### Scenario 1: Auto-match via National ID

**Jean Baptiste** registered at HUEH (P-1001) with National ID `NAT-88001`, then visits OpenELIS lab (LAB-2001) with the same National ID.

- **Rule triggered**: Rule 1 (deterministic)
- **Why it matches**: Exact same National ID `NAT-88001`
- **Result**: Both records linked to the same golden record
- **Note**: Even though the name is slightly different ("Jean Pierre" vs "Jean P."), the National ID match is deterministic

### Scenario 2: Auto-match via Demographics

**Marie Dupont** registered at La Paix (P-1002) then visits OFATMA (P-3001) — same name, gender, and DOB but no shared National ID.

- **Rule triggered**: Rule 2 (probabilistic)
- **Why it matches**: All 4 fields match exactly — given="Marie Claire", family="Dupont", gender="female", birthDate="1990-07-22" — score ~4 >= autoMatchThreshold 4
- **Result**: Auto-matched despite no shared identifier

### Scenario 3: Potential Match (Human Review)

**Jean-Louis Baptiste** registered at Pestel (P-1003) — similar to Jean Pierre Baptiste from Scenario 1.

- **Rule triggered**: Rule 2 (probabilistic)
- **Why it's potential**: family="Baptiste" matches exactly, gender="male" matches, birthDate="1985-03-15" matches, but given="Jean-Louis" vs "Jean Pierre" is a fuzzy match (~0.82 jaro-winkler). Score ~3-3.5, between potentialMatchThreshold (3) and autoMatchThreshold (4)
- **Result**: Flagged as potential match — a human reviewer must decide if this is the same person or a different Jean Baptiste

### Scenario 4: No Match (Unique Person)

**Emmanuel Joseph** at Foyer Saint Camille (P-1004) — completely different name, gender, DOB from everyone else.

- **Result**: No match found. Gets his own golden record.
- **Also demonstrates**: `multipleBirthInteger: 2` (CRF-10)

### Scenario 5: Roaming Care

**Rose Celestin** visits Gressier MS (ISP-5001) with National ID `NAT-88005` and ART Number `ART-7001`, then visits Bethel FDN (ISP-6001) with the same National ID but a different iSantePlus internal ID (different facility).

- **Rule triggered**: Rule 1 (deterministic)
- **Why it matches**: Same National ID `NAT-88005`
- **Result**: Both records linked — continuity of care across facilities
- **Key point**: Each facility assigns its own internal ID, but the shared National ID enables matching

### Scenario 6: Multiple Identifiers

**Louverture Toussaint** at HUEH (P-1006) with Internal ID, National ID, and Code PC.

- **Result**: No match (unique person)
- **Demonstrates**: How the UI renders multiple identifier types with their configured display names from `config.json` systems section

### Scenario 7: Multiple Birth

**Sophia Aristide** at La Paix (P-1007) with `multipleBirthBoolean: true`.

- **Result**: No match (unique person)
- **Demonstrates**: Multiple birth indicator display (OpenHIE CRF-10)

## Expected Results After Seeding

| Golden Records | Description |
|---------------|-------------|
| Golden 1 | Jean Baptiste — 2 records (HUEH + OpenELIS) auto-matched via National ID |
| Golden 2 | Marie Dupont — 2 records (La Paix + OFATMA) auto-matched via demographics |
| Golden 3 | Jean-Louis Baptiste — 1 record, potential match flagged against Golden 1 |
| Golden 4 | Emmanuel Joseph — 1 record, unique |
| Golden 5 | Rose Celestin — 2 records (Gressier MS + Bethel FDN) auto-matched via National ID |
| Golden 6 | Louverture Toussaint — 1 record, unique |
| Golden 7 | Sophia Aristide — 1 record, unique |

**Total**: 10 patient records → 7 golden records, 3 auto-matches, 1 potential match

## Configuration

The matching behavior is driven entirely by configuration files in `example/config/`:

| File | Purpose |
|------|---------|
| `config.json` | Clients (facilities), identifier system display names, ES connection |
| `decisionRules.json` | Matching rules, algorithms, thresholds |
| `PatientRelationship.json` | ES index field mapping (which FHIR fields get indexed) |
