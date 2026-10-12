# State Persistence

Tests for snapshots, restarts, crash recovery, resync, and chain reorganizations.

> **Note:** manual chaos testing finds things CI rarely exercises — partial shutdowns, recovery ordering, resync edge cases.
>
> **CI coverage:** `TestRestart` and `TestSnapshotPolicy` exist in the integration suite but run **only when the test framework manages the node directly** (`isNodeSelfManaged()`). In the standard compose-based CI run these tests are skipped. Treat all entries here as active until CI's compose run is confirmed to execute them.
>
> **Scope boundary:** foreclosure-specific persistence checks (foreclose cursor atomicity, accounts-drive-proof catch-up, emergency withdrawal catch-up) are covered in `track-b/foreclose.md`.

---

## SP-001 — Hard-kill all containers mid-execution

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** chaos-style test; disaster-recovery behavior is operational.
- **Steps:**
  1. While the node is actively processing inputs, hard-kill all containers.
  2. Restart the node.
- **Expected:** node recovers to a consistent state. Document any inputs that need to be replayed.

## SP-002 — Per-input snapshots

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** feature-flag behavior; needs visual confirmation. CI covers the PRT variant (`TestSnapshotPolicyEveryInputPrt`); this checks Authority on a running node (devnet or testnet).
- **Steps:**
  1. Set the policy with `cartesi-rollups-cli app execution-parameters set <app> snapshot_policy EVERY_INPUT`.
  2. Run, observe snapshot creation.
  3. Kill and restart from an input-level snapshot.
- **Expected:** snapshots created per input; restart from one resumes correctly.

## SP-003 — Per-epoch snapshots

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** as above, different granularity. CI covers the PRT variant (`TestSnapshotPolicyEveryEpochPrt`).
- **Steps:**
  1. Set the policy with `cartesi-rollups-cli app execution-parameters set <app> snapshot_policy EVERY_EPOCH`.
  2. Run across multiple epochs.
  3. Restart from an epoch snapshot.
- **Expected:** snapshot per epoch; restart resumes correctly.

## SP-004 — Claimer resync after extended offline

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** resync after a long gap; catch-up behavior not exercised in CI.
- **Steps:**
  1. Run node, let it claim several epochs.
  2. Stop the claimer specifically, let >5 more epochs pass (on a devnet, send inputs and mine the blocks with `cast rpc anvil_mine <n>`).
  3. Restart the claimer.
- **Expected:** claimer catches up without error. Document the catch-up time.

## SP-005 — L1 chain reorganization

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Feasibility:** on a devnet the reorg is created with anvil; on a testnet, run only when one that reorgs is available.
- **Why-not-CI:** CI does not reorg the chain under a running node.
- **Steps:**
  1. Process inputs on the node.
  2. Reorg the block range that holds some of them. On a devnet use anvil: `cast rpc anvil_reorg <depth> '[]'` (or `evm_snapshot` before the inputs, `evm_revert` after them, then mine a different set of blocks and inputs). On a testnet, wait for a natural reorg of that range.
- **Expected:** evm-reader rewinds correctly. No duplicated or lost inputs. Node state consistent with the new chain.

## SP-006 — Startup replay reconciles persisted history against re-execution

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** the deterministic-outcomes rewrite adds a replay engine that re-executes stored history at startup; CI's short-lived runs don't exercise a cold-start replay against a populated database.
- **Steps:**
  1. Run a node to `CLAIM_ACCEPTED` on several epochs across at least one application.
  2. Stop the node and restart it.
  3. Observe the startup logs for replay activity and compare persisted outcomes before/after restart.
- **Expected:** node replays stored history at startup without error, and outcomes recorded before the restart are unchanged by the replay.

## SP-007 — Node fences an application with a contradictory persisted outcome

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** deliberately corrupting persisted state to test the new fencing behavior is destructive and not something CI does against a shared fixture.
- **Steps:**
  1. Run a node to `CLAIM_ACCEPTED` on an application.
  2. Directly edit the database to record an input outcome that contradicts what real execution would produce.
  3. Restart the node.
- **Expected:** the affected application is fenced (its processing halts, application-failure state is recorded) rather than the node crashing or silently accepting the contradictory record. Other, unrelated applications on the same node continue processing normally.

## SP-008 — Advancer preserves machine-database alignment after a hard crash mid-processing, including kills during every-input and every-epoch snapshot writes (each snapshot complete or absent, no database pointer to a partial snapshot)

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** timing a hard-kill mid-advance and asserting alignment afterward is a chaos-style scenario outside CI's deterministic run; timing a hard kill inside a snapshot write is chaos testing too, and CI's snapshot tests never interrupt a write.
- **Steps:**
  1. Submit a burst of inputs so the advancer has active work queued.
  2. Hard-kill the advancer process mid-processing.
  3. Restart it and let it catch up.
  4. Set `snapshot_policy EVERY_INPUT` for an application with a large machine (so each write takes long enough to hit).
  5. Send inputs and send `SIGKILL` to the node while a snapshot directory under `CARTESI_SNAPSHOTS_DIR` is being written; restart. Repeat 20 times.
  6. After each run, list the snapshot directories, check each for completeness (all files present, loadable with `cartesi-machine --load=<dir>`), and query the database pointers: `SELECT index, snapshot_uri FROM input WHERE snapshot_uri IS NOT NULL;`.
  7. Repeat steps 5 and 6 with `snapshot_policy EVERY_EPOCH`, killing during the epoch snapshot write.
- **Expected:** machine state and database state remain aligned after restart — no input is silently skipped, double-applied, or left in an intermediate state. After every snapshot-write kill each snapshot directory is either complete or absent; no `snapshot_uri` names a partial directory; every restart resumes from a complete snapshot (or the template) and reaches the same state.


## SP-009 — Corrupted or unreadable saved snapshot is skipped and the node replays from the template to the same state; corruption that keeps the hash tree intact is detected by page-level verification, or the required operator check is documented

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** alpha.13 logs and skips an invalid or inaccessible snapshot and rebuilds from the template by canonical replay; a replay contradiction then marks the application FAILED. CI has unit fixtures for these faults, not a run against a real snapshot directory. Steps 2 and 3 break a snapshot so that it cannot load; the corruption in steps 4 to 6 keeps the stored hash tree consistent, so only a check of the page data against the tree can find it. CI does not tamper with snapshot files.
- **Steps:**
  1. With `snapshot_policy` set to `EVERY_EPOCH`, run several epochs.
  2. Stop the node, corrupt the latest snapshot directory (truncate a file), and restart.
  3. Repeat with the snapshot directory unreadable (permissions).
  4. With `snapshot_policy` set to `EVERY_EPOCH` (or `EVERY_INPUT`), run until a snapshot exists under `CARTESI_SNAPSHOTS_DIR`; record the latest input's `machine_hash`. Stop the node. In that snapshot, change bytes in a memory range's data file (for example a page of the RAM or flash-drive `.bin` file that the application reads later) and leave the hash-tree files (`.dht`, `.dpt`) and `config.json` untouched.
  5. Restart the node; read the advancer log and the application status, then send inputs that read the corrupted page.
  6. Separately, try the checks an operator could run: loading the snapshot with `cartesi-machine --load=<dir>` and computing its hash, removing the hash-tree files so the hash is recomputed, and an independent replay from the template (`cartesi-rollups-machine-tool replay`) compared with the node's `machine_hash`.
- **Expected:** (2, 3) the node logs the skipped snapshot, replays from the template, and reaches the same state as before; record how long the replay takes. It must not load the corrupted snapshot or silently diverge. (4 to 6) page-level verification detects the corruption before the snapshot is used (the snapshot is skipped and the node replays from the template, as in steps 2 and 3); or the operator check that detects it is documented, with the command and how long it takes.

---

<!-- Add entries for large-inputbox resync, RPC provider failure, WS liveness timeout, etc.
     Many of these overlap naturally with charter material — keep catalog entries for the
     ones that are specific and reproducible. -->
