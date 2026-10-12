# Machine Runtime

Tests for how the node runs the Cartesi Machine that an application's template defines:
NVRAM ranges, drive labels versus fixed `/dev/pmemN` paths, read-only flash drives, removed
MTD paths, the emulator mcycle limit, snapshot atomicity, and reproduction of the node's
TX-buffer results with `cartesi-rollups-machine-tool`.

> **ID prefix:** `RT-*` (runtime). These tests cut across several components, so each entry
> names its **Area** (Runtime, Deployment, Terminal States, State Persistence, Machine Tool),
> which is the value of the spreadsheet's Area / Component column for that row.
>
> **Scope boundary:** terminal states reached by ordinary application failures are in
> `track-b/terminal-states.md`; snapshot policies and crash recovery in general are in
> `track-b/state-persistence.md`; the machine tool's replay and accounts-drive proof
> commands in general are in `track-b/machine-tool.md`.

---

## RT-001 — Deploy an app with an NVRAM range. Read and write it, take a snapshot, restart, and confirm replay produces the same state.

- **Area:** Runtime
- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** CI's test machines do not declare NVRAM ranges; whether guest writes to NVRAM survive snapshots, restarts and replay is only visible on a deployed application.
- **Steps:**
  1. Build a template whose machine config declares an `nvram` range (check the stored template's `config.json`), and whose guest reads a value from that range and writes a new value to it on each input, reporting both.
  2. Deploy it and set `cartesi-rollups-cli app execution-parameters set <app> snapshot_policy EVERY_INPUT`.
  3. Send several inputs; record each report and each input's `machine_hash` (`cartesi_listInputs`).
  4. Restart the node, send more inputs, and check that the first read after the restart returns the last value written before it.
  5. Remove the snapshots (or start a second node from the same database without them) so the node replays from the template, and compare the machine hashes.
- **Expected:** every read returns the last value written; after the restart and after a replay from the template the machine hashes and reports are identical to the original run.

## RT-002 — Confirm the machine hash used for claims includes the NVRAM range. Confirm accounts-drive proofs still work beside that range.

- **Area:** Runtime
- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** CI does not combine an NVRAM range with an accounts drive, and does not check what a claimed machine hash commits to.
- **Steps:**
  1. Deploy an application with a guardian, an accounts drive and an `nvram` range (as in RT-001); credit balances to two accounts.
  2. Send an input whose only effect is to change the NVRAM contents (no accounts-drive change, no output); compare the input's `machine_hash` with the previous input's.
  3. Let the epoch reach `CLAIM_ACCEPTED`; record the claimed machine hash on chain and in `cartesi_listEpochs`. Replay to that epoch with `cartesi-rollups-machine-tool replay --to-epoch <N>` and compare the stored machine's root hash with the claim.
  4. Foreclose, then run `cartesi-rollups-machine-tool prove accounts-drive`, `cartesi-rollups-cli prove-drive-root` and `cartesi-rollups-cli withdraw` for both accounts.
- **Expected:** an NVRAM-only change changes the machine hash, and the claimed hash equals the replayed root, so the range is part of the claim. The accounts-drive proofs are accepted and both withdrawals pay the exact balances.

## RT-003 — Change the initial NVRAM contents and verify getTemplateHash behaves as documented. Deploy the template and confirm the registered hash matches.

- **Area:** Deployment
- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** the template hash is computed from the stored machine at build time; CI uses fixed templates and does not vary NVRAM contents.
- **Steps:**
  1. Build two templates that differ only in the initial contents of an `nvram` range; record each template hash (`cartesi hash`, or the root hash of the stored machine).
  2. Compare the two hashes with what the machine and rollups documentation says about NVRAM and the template hash.
  3. Deploy both with `cartesi-rollups-cli deploy application`, read `getTemplateHash()` from each application contract (`cast call <app> 'getTemplateHash()(bytes32)'`), and compare with `cartesi-rollups-cli app list` and `cartesi_getApplication`.
- **Expected:** the two template hashes differ or match exactly as documented; for each deployment the hash from `getTemplateHash()`, the node database and JSON-RPC equals the built template's hash.

## RT-004 — Start a template that still references removed MTD paths. Confirm build or first advance fails clearly, records the reason, and never hangs.

- **Area:** Terminal States
- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** templates written for older machine versions are an upgrade path, not a CI fixture.
- **Steps:**
  1. Build three templates whose guest still uses removed MTD paths: one whose init script uses the removed drive-label map (`/run/drive-label`), one whose application opens `/dev/mtdblock1` directly, and one that checks for the device and exits with an error when it is missing.
  2. Build each with the Cartesi CLI; for each one that builds, deploy it with `cartesi-rollups-cli deploy application` and send a deposit or input.
  3. Watch the build output, the advancer log, `cartesi-rollups-cli app status`, `cartesi_getApplication` and `cartesi-rollups-cli read inputs` for at least the advance deadline.
- **Expected:** each template fails at build or at its first advance, with an error or terminal state (or FAILED reason) that names the missing path or device; the outcome is recorded on the operator surfaces and nothing waits indefinitely.

## RT-005 — Run equivalent templates using drive labels and fixed /dev/pmemN paths. Confirm both behave the same before and after replacing a labeled memory range.

- **Area:** Runtime
- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** CI does not compare the two ways a guest can locate a drive, nor replacing a memory range in a template.
- **Steps:**
  1. Build two equivalent templates with an extra flash drive: one guest finds it by its label, the other opens a fixed `/dev/pmemN` path (as `test/dapps/erc20-withdrawal/install.sh` does with `/dev/pmem1`).
  2. Deploy both and send the same inputs; compare reports, outputs and the effect on the drive.
  3. Replace the labeled memory range with new contents (same label, same start and length) in both templates, rebuild, redeploy and repeat step 2.
- **Expected:** both templates behave identically before and after the replacement, reading the replaced contents; neither fails or reads the wrong drive.

## RT-006 — Deploy a template with a read-only flash drive. A guest write must fail cleanly without an initialization panic.

- **Area:** Runtime
- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** CI templates do not declare read-only flash drives.
- **Steps:**
  1. Build a template with a flash drive marked `read_only: true` in the machine config, whose guest reads from it at start-up and tries to write to it on a given input.
  2. Deploy it, send an input that reads, then the input that writes, then another input.
  3. Read the advancer log, the input status and the application status.
- **Expected:** the machine initializes and serves reads; the write fails inside the guest with an error the application can handle (a rejected input or report), with no panic during initialization; the node keeps processing later inputs.

## RT-008 — Run an advance to the emulator mcycle limit. Confirm MCYCLE_OVERFLOW is recorded, or document why configured limits make it unreachable.

- **Area:** Terminal States
- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** CI reaches the limit only with a purpose-built machine; this checks what a deployed node does at the emulator boundary and which configured limits stop the advance first.
- **Steps:**
  1. Read the application's `advance_max_cycles` (`cartesi-rollups-cli app execution-parameters get`) and the advance deadline.
  2. Build a machine whose `mcycle` starts close to the emulator limit, for example with `go run ./test/tooling/terminalmachine` in a rollups-node checkout at the tag under test (it sets `mcycle` near `UINT64_MAX` so the next advance crosses it), and deploy it.
  3. Send an input; read the input status, `cartesi-rollups-cli app status`, `cartesi_getApplication` and the advancer log.
  4. With an ordinary template, try to reach the limit by raising `advance_max_cycles` and the deadline, and record which limit stops the advance.
- **Expected:** `MCYCLE_OVERFLOW` is recorded for the application with the input that caused it, and no later input is executed; or the configured limits (cycle cap, deadline) are documented as stopping any real advance before the emulator limit.

## RT-009 — Kill the node during every-input and every-epoch snapshot writes. After 20 runs, each snapshot must be complete or absent, and no database pointer may reference a partial snapshot.

- **Area:** State Persistence
- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** timing a hard kill inside a snapshot write is chaos testing; CI's snapshot tests never interrupt a write.
- **Steps:**
  1. Set `snapshot_policy EVERY_INPUT` for an application with a large machine (so each write takes long enough to hit).
  2. Send inputs and send `SIGKILL` to the node while a snapshot directory under `CARTESI_SNAPSHOTS_DIR` is being written; restart. Repeat 20 times.
  3. After each run, list the snapshot directories, check each for completeness (all files present, loadable with `cartesi-machine --load=<dir>`), and query the database pointers: `SELECT index, snapshot_uri FROM input WHERE snapshot_uri IS NOT NULL;`.
  4. Repeat steps 2 and 3 with `snapshot_policy EVERY_EPOCH`, killing during the epoch snapshot write.
- **Expected:** after every run each snapshot directory is either complete or absent; no `snapshot_uri` names a partial directory; every restart resumes from a complete snapshot (or the template) and reaches the same state.

## RT-010 — Replay an epoch with accepted, rejected, and multi-output inputs. Confirm machine-tool reproduces the node's TX-buffer block and output hashes.

- **Area:** Machine Tool
- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** CI does not run the machine tool against an epoch that mixes accepted and rejected inputs; this is the independent check of what the node claims.
- **Steps:**
  1. In one epoch, send an accepted input, an input the application rejects, and an input that emits several outputs (vouchers and notices); let the epoch reach `CLAIM_ACCEPTED`.
  2. Record from the node each input's `machine_hash` and `tx_buffer_data_block`, the epoch's `tx_buffer_data_block` and machine hash, and each output's hash and proof (`cartesi_listInputs`, `cartesi_listEpochs`, `cartesi_listOutputs`).
  3. Run `cartesi-rollups-machine-tool replay --template <path> --application <app> --to-epoch <N> --store <dir>` (and `--to-input-index` for each input); from each stored machine read the root hash, the TX-buffer data block and the output hashes.
  4. Compare with the node's values and with the claim on chain.
- **Expected:** the machine tool reproduces the node's machine hash, TX-buffer data block and output hashes for the epoch and for every input, including the rejected one and the multi-output one.
- **Notes:**
  - In alpha.13, `replay` selects inputs with completion status `ACCEPTED` only (`collectReplayInputs` in `cmd/cartesi-rollups-machine-tool/main.go`). The rejected input is in the epoch to check that skipping it still reproduces the node's values.

---

<!-- Add entries for other template features (new drive types, memory-range changes)
     as the machine runtime evolves. -->
