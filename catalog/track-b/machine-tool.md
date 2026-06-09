# Machine Tool (`cartesi-rollups-machine-tool`)

Tests for the `cartesi-rollups-machine-tool` binary used to replay accepted state and generate accounts-drive proof files for emergency withdrawal flows.

> **Scope boundary:** this file covers only the machine tool (`replay`, `prove accounts-drive`). Operator CLI commands (`cartesi-rollups-cli`) remain in `track-b/internal-cli.md`.

---

## MTL-001 — `replay` advances machine to a stored snapshot

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** requires a running node DB with accepted epochs; CI integration tests do not validate the machine-tool binary separately.
- **Steps:**
  1. Run a node to `CLAIM_ACCEPTED` on at least one epoch.
  2. Run `cartesi-rollups-machine-tool replay --template <path> --application <app> --to-epoch <N> --store <snapshot-dir>`.
  3. Confirm the snapshot directory is written.
- **Expected:** Snapshot written at the specified path. Replay is deterministic: running twice produces bit-identical machine state.

## MTL-002 — `prove accounts-drive` generates valid proof files

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** end-to-end proof generation requires a stored snapshot from a running application; CI does not cover this binary.
- **Steps:**
  1. Produce a snapshot with MTL-001.
  2. Run `cartesi-rollups-machine-tool prove accounts-drive --snapshot <dir> --account <addr> --accounts-drive-start-index <hex> --out-drive-root-proof drive-root-proof.json --out-withdraw-proof account-proof.json`.
  3. Pass the output files to `cartesi-rollups-cli prove-drive-root` and `cartesi-rollups-cli withdraw`.
- **Expected:** Both JSON files created. `prove-drive-root` accepts the drive-root proof without error. `withdraw` accepts the account proof and emits a `Withdrawal` event on-chain.

---
