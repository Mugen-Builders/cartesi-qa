---
name: cartesi-qa-catalog
description: QA Catalog and Spreadsheet Synchronization for Cartesi v2
tags: [cartesi, qa, testing, documentation, spreadsheet, markdown, automation]
---

# Cartesi QA Catalog & Spreadsheet Workflow

Comprehensive guidance for maintaining and synchronizing the Cartesi QA catalog (`catalog/`) with the automated spreadsheet seed generator (`sheets/qa-template-setup.gs`).

## Core Principles

### 1. Markdown is the Source of Truth

- **Catalog markdown files are authoritative** for test IDs, descriptions, environments, risk levels, and canonical order.
- The spreadsheet is generated *from* the markdown, not the other way around.
- When the sheet and markdown diverge, always correct the sheet to match the markdown source.
- This is explicitly documented in [catalog/README.md](catalog/README.md).

### 2. Test + Environment Tuple Model

Each test is defined as an **(ID, Description, Environment(s))** tuple:

- **Single environment (`devnet` only or `testnet` only)**: one markdown entry, one sheet row.
- **Dual environment (`devnet + testnet`)**: one markdown entry with `Environment: devnet + testnet`, two sheet rows (one per env).
- **No testnet-only tests should appear on devnet** in the sheet unless the markdown explicitly supports both.

### 3. Spreadsheet Rows Mirror Tuples Exactly

The sheet must contain exactly one row for each explicit markdown tuple. If the markdown defines:
```
- Environment: devnet + testnet
```
then the sheet has two rows, one labeled `devnet` and one `testnet`.

If a test is testnet-only:
```
- Environment: testnet
```
then only a `testnet` row exists in the sheet; remove any orphaned `devnet` row.

## Catalog Structure

### Track A — Release Smoke Checklist (`catalog/track-a.md`)

- **IDs**: `SMK-001` through `SMK-006` (six core smoke tests).
- **Purpose**: minimal verification that a deployed release is operational (dev smoke, testnet deploy, testnet smoke).
- **Environment**: each `SMK-*` test defines its own environment (usually `devnet` or `testnet`).
- **Order**: follows the "Canonical Execution Order (Source of Truth)" section; respects deployment phases (devnet smoke → testnet deploy → testnet smoke).
- **Spreadsheet**: Track A rows are generated from the markdown entries in ID order.

### Track B — Regression & Validation Tests (`catalog/track-b/`)

Each test's environment is **determined individually** from its markdown entry. Do not assume a suite-wide policy; always check the `Environment:` field in the markdown for each test.

**Current environment snapshot (as of June 2026):**

| Suite | File | Current Pattern | Examples |
|-------|------|-----------------|----------|
| Outputs | `outputs.md` | All dual | `OUT-001..004` |
| Configuration | `configuration.md` | All testnet | `CFG-001..009` |
| Egress | `egress.md` | All dual | `EGR-001..004` |
| Foreclosure | `foreclose.md` | All dual | `FOR-001..014` |
| Inputs | `inputs.md` | All dual | `INP-001..004` |
| Inspect Service | `inspect-service.md` | All dual | `INS-001..006` |
| JSON-RPC API | `jsonrpc-api.md` | All dual | `JRP-001..008` |
| Machine Tool | `machine-tool.md` | All dual | `MTL-001..002` |
| Internal CLI | `internal-cli.md` | Mixed | `ILC-001..004` testnet; `ILC-005/006/010` dual; `ILC-007..009` testnet |
| Multi-App | `multi-app.md` | All testnet | `MA-001..002` |
| Quorum | `quorum.md` | All testnet | `QUO-001..002` |
| Services | `services.md` | All testnet | `SVC-001..002` |
| State Persistence | `state-persistence.md` | All testnet | `SP-001..005` |
| Deployment | `deployment.md` | Mixed | `DEP-001/002` devnet; `DEP-003..005` testnet |
| CLI (User) | `cli.md` | All devnet | `CLI-*` |

**This is not prescriptive.** Future tests may deviate from the current pattern. Always verify the `Environment:` field in the markdown source for each individual test before adding or adjusting sheet rows.

### Track C — Exploratory Charters (`charters/`)

- **IDs**: `CHR-001..005` (exploratory investigation sessions).
- **Purpose**: investigate edge cases and known risk areas. Takes as long as needed until complete.
- **No environment column** (not a fixed test plan).

### Regression Watch (`catalog/regression-watch.md` → spreadsheet `RW-*`)

- **IDs**: `RW-001..007` (re-check every cycle).
- **Purpose**: verify that fixed issues remain fixed.
- **Spreadsheet row**: mark as ✅ (Done) once confirmed; remove the row if the issue is permanently closed.

## Markdown Entry Format

Each test is documented as a level-3 heading and structured as:

```markdown
### ID — Short title

- **Risk:** [H|M|L]
- **Environment:** [devnet | testnet | devnet + testnet]
- **Why-not-CI:** brief explanation of why this is not in CI.
- **Steps:** numbered procedure.
- **Expected:** outcome statement.
```

**Required fields:**
- `Risk`: criticality (H/M/L).
- `Environment`: single or dual environment.
- `Why-not-CI`: reason it's operator/integration scoped.
- `Steps` and `Expected`: clear procedure and assertion.

## Spreadsheet Generator (`sheets/qa-template-setup.gs`)

### Data Structure

The sheet is built from a JavaScript array of test tuples:

```javascript
[
  ['ID',      'Track', 'Area',  'Description', 'Environment'],
  ['SMK-001', 'A',     'Smoke', 'Check node startup…', 'devnet'],
  ['OUT-001', 'B',     'Outputs', 'Handle >2MB notice…', 'devnet'],
  ['OUT-001', 'B',     'Outputs', 'Handle >2MB notice…', 'testnet'],  // dual tuple
  …
]
```

### Generation Rules

1. **Each markdown entry** produces **one or more rows** based on its `Environment:` field.
2. **Check each test individually**: read the markdown `Environment:` value for every test ID before adding or adjusting sheet rows.
3. **Dual-environment (`devnet + testnet`)**: two rows, same ID, one per env.
4. **Single environment (`devnet` or `testnet` only)**: one row.
5. **Do not apply suite-wide policies**: a test's environment is determined by its markdown entry, not by historical suite patterns.
6. **Verify tuples exist**: do not add sheet rows for tests that are not in the markdown source.

### Common Patterns

**Adding a new dual-env test:**
1. Add entry to markdown with `Environment: devnet + testnet`.
2. Add **two** array rows to the sheet, both with the same ID and description, env differing.
3. Verify by running a count check (see Validation below).

**Converting a suite from dual to testnet-only:**
1. Update markdown entries to `Environment: testnet`.
2. Remove all `devnet` rows from the sheet for that test ID.
3. Validate tuple counts.

**Adding a testnet-only test:**
1. Add markdown entry with `Environment: testnet`.
2. Add one sheet row with env `testnet`.
3. Do **not** add a `devnet` row.

## Validation Workflow

### Tuple-Count Validation

Run a quick check to ensure sheet rows match markdown tuples:

```bash
node - <<'NODE'
const fs = require('fs');
const text = fs.readFileSync('sheets/qa-template-setup.gs', 'utf8');

// Define expected counts per ID (1 for single-env, 2 for dual-env)
const expectedCounts = {
  'OUT-001': 2,      // dual
  'CFG-001': 1,      // testnet only
  'MA-001': 1,       // testnet only
  'ILC-005': 2,      // dual
  'ILC-001': 1,      // testnet only
  // … add all test IDs
};

const mismatches = [];
for (const [id, expected] of Object.entries(expectedCounts)) {
  const count = (text.match(new RegExp(`\\['${id}'`, 'g')) || []).length;
  if (count !== expected) {
    mismatches.push({ id, expected, count });
  }
}

if (mismatches.length === 0) {
  console.log('✅ All tuple counts match!');
} else {
  console.log('❌ Mismatches found:');
  console.table(mismatches);
}
NODE
```

### Reconciliation Checklist

Before committing sheet changes:

- [ ] For **each test ID in the markdown**, verify its `Environment:` field.
- [ ] Confirm the sheet has **exactly** that many rows for that ID:
  - `devnet` only: one row with env `devnet`.
  - `testnet` only: one row with env `testnet`.
  - `devnet + testnet`: two rows, one per env.
- [ ] No orphaned rows exist for tests that do not appear in the markdown source.
- [ ] No missing rows exist for tests with dual environments in the markdown.
- [ ] Run the tuple-count validation script to catch count mismatches.

## Git Workflow

### When to Disable Auto-Commit

Auto-committing should be **disabled** when:
- Making multiple incremental reconciliation passes.
- Validating source and sheet alignment before a final commit.
- Iterating on environment policy decisions.

**To disable auto-commit in the terminal, run:**
```bash
# Store the original setting
auto_commit_enabled=false
```

Or in the Git config for the repository:
```bash
git config --local cartesi-qa.auto-commit false
```

### Final Commit

When ready to commit after validation:

```bash
git add catalog/ sheets/
git commit -m "Sync catalog Track B environments and sheet tuples to [brief description]"
git push
```

Do not auto-commit intermediate changes; always validate manually first.

## Common Mistakes & Fixes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Assuming a suite has a fixed policy | Adding rows based on "Configuration tests should always be testnet-only" | Always check the `Environment:` field in the markdown for each individual test. |
| Extra row for single-env test | Row count mismatch; e.g., `ILC-001` has 2 rows but markdown says `testnet` only | Read the markdown and remove the `devnet` row for that ID. |
| Missing row for dual-env test | Row count is 1 but markdown says `devnet + testnet` | Add a matching row with the missing environment. |
| Markdown `Environment:` field missing or wrong | Sheet rows are inconsistent with test descriptions or intended scope | Check the markdown source; ensure every test has an explicit `Environment:` line. |
| Sheet row added without markdown source | Orphaned row for a test ID that doesn't exist in markdown | Verify the test exists in the markdown file; remove the row if it doesn't. |

## Referencing This Workflow

When adding tests or updating the catalog:

1. Open the markdown file for the suite.
2. Find the test entry and check its `Environment:` field.
3. If the test doesn't exist yet, create a new entry with the correct `Environment:` line.
4. Add corresponding sheet row(s) to match the markdown environment(s).
5. Run validation check.
6. Commit only after validation passes.

**Do not assume a suite has a fixed policy.** Every test's environment is independent.

## Key Files

- `catalog/track-a.md` — Release smoke checklist with canonical order.
- `catalog/track-b/*.md` — Regression & validation tests by area.
- `catalog/README.md` — Source-of-truth declaration.
- `charters/*.md` — Exploratory session notes.
- `sheets/qa-template-setup.gs` — Spreadsheet generator (JavaScript/GAS).
- `templates/` — Markdown and sheet templates for new entries.

---

**Last updated:** June 2026 | **Session focus:** Track B environment policy and sheet synchronization.
