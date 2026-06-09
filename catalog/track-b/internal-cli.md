# Internal Operator CLI (`cartesi-rollups-cli`)

Tests for the `cartesi-rollups-cli` operator tool: database management, application lifecycle, on-chain operations.

> **Note:** this CLI was entirely untested in the last cycle (Phase 12 all Out of Scope). CI does not cover it. Entries here focus on the operator-critical paths; exhaustive coverage of every flag is not the goal.

---

## ILC-001 — `db check` detects schema version mismatch

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** database migration integrity; CI always starts from a fresh schema.
- **Steps:**
  1. Run `cartesi-rollups-cli db init` on a fresh database.
  2. Manually alter the schema version in the migrations table.
  3. Run `cartesi-rollups-cli db check`.
- **Expected:** mismatch detected and reported clearly. Specific version numbers named.

## ILC-002 — `app register` then `app list`

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** application management lifecycle used by operators.
- **Steps:**
  1. Register a new application with `cartesi-rollups-cli app register`.
  2. List applications with `cartesi-rollups-cli app list`.
- **Expected:** registered application appears with `ENABLED` status. Pagination flags (`--limit`, `--offset`) return correct slices.

## ILC-003 — `app remove` transitions app to DISABLED

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** operator decommission flow; CI doesn't manage app lifecycle via the operator CLI.
- **Steps:**
  1. Register an application.
  2. Remove it with `cartesi-rollups-cli app remove`.
  3. Check status.
- **Expected:** application transitions to `DISABLED` in the database. Services stop processing it.

## ILC-004 — `validate` confirms notice proof on-chain

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** real on-chain proof verification via operator CLI; not covered by the developer CLI path.
- **Steps:**
  1. Process an input that generates a notice.
  2. Run `cartesi-rollups-cli validate` with the notice reference.
- **Expected:** Merkle proof validated successfully against the on-chain contract. Receipt returned.

## ILC-005 — `execute` executes voucher on-chain

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** real on-chain voucher execution via operator CLI.
- **Steps:**
  1. Process an input that generates a voucher.
  2. Run `cartesi-rollups-cli execute` with the voucher reference.
- **Expected:** voucher executed on-chain. Transaction receipt returned.

## ILC-006 — `send --hex --async` flag combination

- **Risk:** M
- **Environment:** devnet
- **Why-not-CI:** flag interaction; async send path not tested by CI's synchronous lifecycle tests.
- **Steps:**
  1. Send a hex-encoded payload with `cartesi-rollups-cli send --hex --async`.
- **Expected:** payload accepted and decoded correctly. Async mode returns without waiting for processing.

---

## ILC-007 — `deploy quorum` creates a v3 Quorum consensus

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** v3 Quorum factory deployment; CI uses pre-deployed contracts, not this command.
- **Steps:**
  1. Run `cartesi-rollups-cli deploy quorum` with valid operator addresses and threshold.
  2. Query the returned Quorum address to confirm it was registered with the factory.
- **Expected:** Quorum contract deployed. Address printed and confirmed on-chain. Deployment is replayable with same arguments.

## ILC-008 — `deploy application` with v3 flags

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** `--claim-staging-period` and `--withdrawal-config` flags are new; CI does not exercise them.
- **Steps:**
  1. Deploy with `--claim-staging-period <N>`.
  2. Deploy with `--withdrawal-config-file <file>` pointing to a valid JSON config.
  3. Deploy with a partial (invalid) withdrawal config and confirm it is rejected.
- **Expected:** (1) claim staging period stored; (2) withdrawal config columns populated with all five typed fields; (3) partial config fails fast with a clear error before any on-chain transaction.

## ILC-009 — `read epochs` shows v3 epoch states

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** new staged and foreclosed epoch states visible only after the lifecycle runs; CI does not inspect via the operator CLI.
- **Steps:**
  1. Run a node through a normal staging cycle.
  2. Run `cartesi-rollups-cli read epochs <app>`.
  3. Foreclose the application and run `read epochs` again.
- **Expected:** (1) epochs appear with `CLAIM_SUBMITTED`, `CLAIM_STAGED`, `CLAIM_ACCEPTED` states as the cycle progresses; (2) after foreclosure the affected epoch reports `CLAIM_FORECLOSED`.

## ILC-010 — `contract` output shows v3 fields

- **Risk:** M
- **Environment:** devnet
- **Why-not-CI:** JSON shape of the contract output changed; CI does not assert the full field set.
- **Steps:**
  1. Register and configure an application with a withdrawal config and guardian.
  2. Run `cartesi-rollups-cli contract <app>` (or equivalent read command).
- **Expected:** Output includes `enabled`, `status`, `claim_staging_period`, `withdrawal_config`, `foreclose_block`, `accounts_drive_proved_block`. No old single-state field present.

---

<!-- Add entries for execution-parameters set/get and db init when those paths become operator-relevant. -->
