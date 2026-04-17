# Internal Operator CLI (`cartesi-rollups-cli`)

Tests for the `cartesi-rollups-cli` operator tool: database management, application lifecycle, on-chain operations.

> **Note:** this CLI was entirely untested in the last cycle (Phase 12 all Out of Scope). CI does not cover it. Entries here focus on the operator-critical paths; exhaustive coverage of every flag is not the goal.

---

## ILC-001 — `db check` detects schema version mismatch

- **Risk:** H
- **Why-not-CI:** database migration integrity; CI always starts from a fresh schema.
- **Steps:**
  1. Run `cartesi-rollups-cli db init` on a fresh database.
  2. Manually alter the schema version in the migrations table.
  3. Run `cartesi-rollups-cli db check`.
- **Expected:** mismatch detected and reported clearly. Specific version numbers named.

## ILC-002 — `app register` then `app list`

- **Risk:** H
- **Why-not-CI:** application management lifecycle used by operators.
- **Steps:**
  1. Register a new application with `cartesi-rollups-cli app register`.
  2. List applications with `cartesi-rollups-cli app list`.
- **Expected:** registered application appears with `ENABLED` status. Pagination flags (`--limit`, `--offset`) return correct slices.

## ILC-003 — `app remove` transitions app to DISABLED

- **Risk:** H
- **Why-not-CI:** operator decommission flow; CI doesn't manage app lifecycle via the operator CLI.
- **Steps:**
  1. Register an application.
  2. Remove it with `cartesi-rollups-cli app remove`.
  3. Check status.
- **Expected:** application transitions to `DISABLED` in the database. Services stop processing it.

## ILC-004 — `validate` confirms notice proof on-chain

- **Risk:** H
- **Why-not-CI:** real on-chain proof verification via operator CLI; not covered by the developer CLI path.
- **Steps:**
  1. Process an input that generates a notice.
  2. Run `cartesi-rollups-cli validate` with the notice reference.
- **Expected:** Merkle proof validated successfully against the on-chain contract. Receipt returned.

## ILC-005 — `execute` executes voucher on-chain

- **Risk:** H
- **Why-not-CI:** real on-chain voucher execution via operator CLI.
- **Steps:**
  1. Process an input that generates a voucher.
  2. Run `cartesi-rollups-cli execute` with the voucher reference.
- **Expected:** voucher executed on-chain. Transaction receipt returned.

## ILC-006 — `send --hex --async` flag combination

- **Risk:** M
- **Why-not-CI:** flag interaction; async send path not tested by CI's synchronous lifecycle tests.
- **Steps:**
  1. Send a hex-encoded payload with `cartesi-rollups-cli send --hex --async`.
- **Expected:** payload accepted and decoded correctly. Async mode returns without waiting for processing.

---

<!-- Add entries for execution-parameters set/get and db init when those paths become operator-relevant. -->
