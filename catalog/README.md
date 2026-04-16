# Test Catalog

The catalog is the master list of all known manual tests, organized by component. Each file covers one component area.

## What goes in the catalog

Specific, repeatable, pre-written tests. Each entry says: *do this exact thing, expect this exact result.* These populate Track A (smoke) and Track B (deep validation) in each cycle.

## What does NOT go in the catalog

- Exploratory missions (those go in `charters/`)
- One-off experiments (either promote to a real catalog entry or discard)
- Tests fully covered by CI (the one filter — see root README)

## Entry format

Every test entry includes:

- **ID** — stable identifier, e.g. `CLI-001`, `INP-014`
- **Name** — short descriptive name
- **Track** — A or B
- **Risk** — H / M / L (impact × likelihood)
- **Why-not-CI** — one-line justification for being a manual test
- **Steps** — numbered, reproducible
- **Expected** — what should happen
- **Environments** — where this test applies (self-hosted, fly.io, specific testnets)

## Files

| File | Component |
|---|---|
| `cli.md` | Cartesi CLI commands (build, run, deposit, send, etc.) |
| `inputs.md` | Input handling (generic, ETH, ERC20, ERC721, ERC1155) |
| `outputs.md` | VM outputs (notices, vouchers, reports, inspect) |
| `egress.md` | Voucher execution, notice validation, L1 interaction |
| `configuration.md` | Environment variables, startup validation, feature flags |
| `state-persistence.md` | Snapshots, restarts, recovery, reorgs |
| `multi-app.md` | Multi-application scheduling, consensus modes |
| `inspect-service.md` | Inspect API boundaries, concurrency |
| `services.md` | Individual service behavior (advancer, claimer, evm-reader, validator) |
| `deployment.md` | Cross-environment deploys (self-hosted, fly.io, testnets) |

## Growing and pruning the catalog

**Grow:** when a Track C charter finds a specific reproducible bug, promote it to a catalog entry so future cycles catch any regression.

**Prune:** after each cycle, review the catalog:
- Remove entries CI now covers reliably.
- Adjust risk levels based on what actually got found.
- Demote entries that haven't found a bug in 3+ cycles to a lower-frequency track.
