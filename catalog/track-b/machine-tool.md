# Machine Tool (`cartesi-rollups-machine-tool`)

Tests for the `cartesi-rollups-machine-tool` binary used to replay accepted state and generate accounts-drive proof files for emergency withdrawal flows.

> **Scope boundary:** this file covers only the machine tool (`replay`, `prove accounts-drive`). Operator CLI commands (`cartesi-rollups-cli`) remain in `track-b/internal-cli.md`.

---

## MTL-001 — cartesi-rollups-machine-tool replay writes a deterministic snapshot for an accepted epoch and reproduces the node's TX-buffer block and output hashes for accepted, rejected and multi-output inputs

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** requires a running node DB with accepted epochs; CI integration tests do not validate the machine-tool binary separately, and do not run it against an epoch that mixes accepted and rejected inputs. This is the independent check of what the node claims.
- **Steps:**
  1. In one epoch, send an accepted input, an input the application rejects, and an input that emits several outputs (vouchers and notices); run the node until that epoch is `CLAIM_ACCEPTED`.
  2. Record from the node each input's `machine_hash` and `tx_buffer_data_block`, the epoch's `tx_buffer_data_block` and machine hash, and each output's hash and proof (`cartesi_listInputs`, `cartesi_listEpochs`, `cartesi_listOutputs`).
  3. Run `cartesi-rollups-machine-tool replay --template <path> --application <app> --to-epoch <N> --store <snapshot-dir>` and confirm the snapshot directory is written. Run it again into a second directory and compare the two.
  4. Run `replay` with `--to-input-index` for each input; from each stored machine read the root hash, the TX-buffer data block and the output hashes.
  5. Compare with the node's values and with the claim on chain.
- **Expected:** Snapshot written at the specified path. Replay is deterministic: running twice produces bit-identical machine state. The machine tool reproduces the node's machine hash, TX-buffer data block and output hashes for the epoch and for every input, including the rejected one and the multi-output one.
- **Notes:**
  - In alpha.13, `replay` selects inputs with completion status `ACCEPTED` only (`collectReplayInputs` in `cmd/cartesi-rollups-machine-tool/main.go`). The rejected input is in the epoch to check that skipping it still reproduces the node's values.

## MTL-002 — `prove accounts-drive` generates valid proof files

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** end-to-end proof generation requires a stored snapshot from a running application; CI does not cover this binary.
- **Steps:**
  1. Produce a snapshot with MTL-001.
  2. Run `cartesi-rollups-machine-tool prove accounts-drive --snapshot <dir> --account <addr> --accounts-drive-start-index <hex> --out-drive-root-proof drive-root-proof.json --out-withdraw-proof account-proof.json`.
  3. Pass the output files to `cartesi-rollups-cli prove-drive-root` and `cartesi-rollups-cli withdraw`.
- **Expected:** Both JSON files created. `prove-drive-root` accepts the drive-root proof without error. `withdraw` accepts the account proof and emits a `Withdrawal` event on-chain.

---
