# State Persistence

Tests for snapshots, restarts, crash recovery, resync, and chain reorganizations.

> **Note:** manual chaos testing finds things CI rarely exercises — partial shutdowns, recovery ordering, resync edge cases.
>
> **CI coverage:** `TestRestart` and `TestSnapshotPolicy` exist in the integration suite but run **only when the test framework manages the node directly** (`isNodeSelfManaged()`). In the standard compose-based CI run these tests are skipped. Treat all entries here as active until CI's compose run is confirmed to execute them.

---

## SP-002 — Hard-kill all containers mid-execution

- **Risk:** H
- **Why-not-CI:** chaos-style test; disaster-recovery behavior is operational.
- **Steps:**
  1. While the node is actively processing inputs, hard-kill all containers.
  2. Restart the node.
- **Expected:** node recovers to a consistent state. Document any inputs that need to be replayed.

## SP-003 — Per-input snapshots

- **Risk:** M
- **Why-not-CI:** feature-flag behavior; needs visual confirmation.
- **Steps:**
  1. Configure `--save-snapshot=every-input`.
  2. Run, observe snapshot creation.
  3. Kill and restart from an input-level snapshot.
- **Expected:** snapshots created per input; restart from one resumes correctly.

## SP-004 — Per-epoch snapshots

- **Risk:** M
- **Why-not-CI:** as above, different granularity.
- **Steps:**
  1. Configure `--save-snapshot=every-epoch`.
  2. Run across multiple epochs.
  3. Restart from an epoch snapshot.
- **Expected:** snapshot per epoch; restart resumes correctly.

## SP-005 — Claimer resync after extended offline

- **Risk:** H
- **Why-not-CI:** resync under real chain conditions; catch-up behavior not exercised in CI.
- **Steps:**
  1. Run node, let it claim several epochs.
  2. Stop the claimer specifically, let >5 more epochs pass.
  3. Restart the claimer.
- **Expected:** claimer catches up without error. Document the catch-up time.

## SP-006 — L1 chain reorganization

- **Risk:** H
- **Feasibility:** run only when a suitable testnet or Anvil reorg setup is available.
- **Why-not-CI:** hard to simulate in CI; needs a testnet that will reorg.
- **Steps:**
  1. Process inputs on a testnet susceptible to reorgs (or simulate via Anvil).
  2. Trigger/wait for a reorg of the relevant block range.
- **Expected:** evm-reader rewinds correctly. No duplicated or lost inputs. Node state consistent with the new chain.

---

<!-- Add entries for large-inputbox resync, RPC provider failure, WS liveness timeout, etc.
     Many of these overlap naturally with charter material — keep catalog entries for the
     ones that are specific and reproducible. -->
