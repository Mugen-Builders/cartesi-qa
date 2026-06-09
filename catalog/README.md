# Test Catalog

The catalog is the master list of all known manual tests, organized by component. Each file covers one component area.

## Structure

| Path | Contents |
|---|---|
| `track-a.md` | All Track A (smoke) tests in a single runnable checklist |
| `track-b/` | Track B (deep validation) tests, one file per component |
| `regression-watch.md` | Ephemeral list of known open issues to re-check next cycle |

Track A is intentionally allowed to overlap with CI — it exists for human confirmation on a real release, not to cover gaps. Track B must not duplicate what CI already asserts; the filter is in the root README. `regression-watch.md` is not a test file — it holds specific questions from prior cycles. Entries are removed when confirmed fixed.

Markdown files in `catalog/` are the source of truth for test definition and order. Any spreadsheet or automation output must mirror IDs, environments, and execution order from the markdown files.

## What goes in the catalog

Specific, repeatable, pre-written tests. Each entry says: *do this exact thing, expect this exact result.*

## What does NOT go in track B

- Anything the CI integration suite already asserts on Anvil (check `test/integration/` before adding)
- Exploratory missions (those go in `charters/`)
- One-shot regression checks for open bugs (those go in `regression-watch.md`, not here)

## Entry format

Every test entry includes:

- **ID** — stable identifier, e.g. `CLI-001`, `INP-014`
- **Name** — short descriptive name
- **Risk** — H / M / L (impact × likelihood)
- **Why-not-CI** — one-line justification for being a manual test
- **Steps** — numbered, reproducible
- **Expected** — what should happen
- **Environments** — where this test applies (self-hosted, fly.io, specific testnets)

## Track B component files

| File | Component |
|---|---|
| `track-b/cli.md` | Cartesi CLI commands (build, run, deposit, send, etc.) |
| `track-b/inputs.md` | Input handling (generic, ETH, ERC20, ERC721, ERC1155) |
| `track-b/outputs.md` | VM outputs (notices, vouchers, reports, inspect) |
| `track-b/egress.md` | Voucher execution, notice validation, L1 interaction |
| `track-b/configuration.md` | Environment variables, startup validation, feature flags |
| `track-b/state-persistence.md` | Snapshots, restarts, recovery, reorgs |
| `track-b/multi-app.md` | Multi-application scheduling on a single node |
| `track-b/quorum.md` | Quorum consensus behavior for one app across multiple validators |
| `track-b/inspect-service.md` | Inspect API boundaries, concurrency |
| `track-b/services.md` | Individual service behavior (advancer, claimer, evm-reader, validator) |
| `track-b/deployment.md` | Cross-environment deploys (self-hosted, fly.io, testnets) |
| `track-b/jsonrpc-api.md` | JSON-RPC API edge cases, pagination, error code conformance |
| `track-b/internal-cli.md` | Operator CLI (`cartesi-rollups-cli`): db, app lifecycle, on-chain ops |
| `track-b/machine-tool.md` | Machine tool (`cartesi-rollups-machine-tool`): replay and accounts-drive proof generation |
| `track-b/foreclose.md` | Foreclosure lifecycle and emergency withdrawal recovery path |

## Growing and pruning the catalog

**Grow:** when a Track C charter finds a specific reproducible bug, promote it to a catalog entry so future cycles catch any regression.

**Prune:** after each cycle, review the catalog:
- Remove entries CI now covers reliably.
- Adjust risk levels based on what actually got found.
- Demote entries that haven't found a bug in 3+ cycles to a lower-frequency track.
