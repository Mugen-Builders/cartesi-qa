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
- **Environment:** testnet
- **Why-not-CI:** chaos-style test; disaster-recovery behavior is operational.
- **Steps:**
  1. While the node is actively processing inputs, hard-kill all containers.
  2. Restart the node.
- **Expected:** node recovers to a consistent state. Document any inputs that need to be replayed.

## SP-002 — Per-input snapshots

- **Risk:** M
- **Last Scheduled Test:** v2-alpha12
- **Environment:** testnet
- **Why-not-CI:** feature-flag behavior; needs visual confirmation.
- **Steps:**
  1. Configure `--save-snapshot=every-input`.
  2. Run, observe snapshot creation.
  3. Kill and restart from an input-level snapshot.
- **Expected:** snapshots created per input; restart from one resumes correctly.

## SP-003 — Per-epoch snapshots

- **Risk:** M
- **Last Scheduled Test:** v2-alpha12
- **Environment:** testnet
- **Why-not-CI:** as above, different granularity.
- **Steps:**
  1. Configure `--save-snapshot=every-epoch`.
  2. Run across multiple epochs.
  3. Restart from an epoch snapshot.
- **Expected:** snapshot per epoch; restart resumes correctly.

## SP-004 — Claimer resync after extended offline

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** resync under real chain conditions; catch-up behavior not exercised in CI.
- **Steps:**
  1. Run node, let it claim several epochs.
  2. Stop the claimer specifically, let >5 more epochs pass.
  3. Restart the claimer.
- **Expected:** claimer catches up without error. Document the catch-up time.

## SP-005 — L1 chain reorganization

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Feasibility:** run only when a suitable testnet or Anvil reorg setup is available.
- **Why-not-CI:** hard to simulate in CI; needs a testnet that will reorg.
- **Steps:**
  1. Process inputs on a testnet susceptible to reorgs (or simulate via Anvil).
  2. Trigger/wait for a reorg of the relevant block range.
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

## SP-008 — Advancer preserves machine-database alignment after a crash mid-processing

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** timing a hard-kill mid-advance and asserting alignment afterward is a chaos-style scenario outside CI's deterministic run.
- **Steps:**
  1. Submit a burst of inputs so the advancer has active work queued.
  2. Hard-kill the advancer process mid-processing.
  3. Restart it and let it catch up.
- **Expected:** machine state and database state remain aligned after restart — no input is silently skipped, double-applied, or left in an intermediate state.

---

<!-- Add entries for large-inputbox resync, RPC provider failure, WS liveness timeout, etc.
     Many of these overlap naturally with charter material — keep catalog entries for the
     ones that are specific and reproducible. -->
