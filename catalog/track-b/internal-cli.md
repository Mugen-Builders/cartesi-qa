# Internal Operator CLI (`cartesi-rollups-cli`)

Tests for the `cartesi-rollups-cli` operator tool: database management, application lifecycle, on-chain operations.

> **Note:** this CLI was entirely untested in the last cycle (Phase 12 all Out of Scope). CI does not cover it. Entries here focus on the operator-critical paths; exhaustive coverage of every flag is not the goal.

---

## ILC-001 — `db check` detects schema version mismatch

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** database migration integrity; CI always starts from a fresh schema.
- **Steps:**
  1. Run `cartesi-rollups-cli db init` on a fresh database.
  2. Manually alter the schema version in the migrations table.
  3. Run `cartesi-rollups-cli db check`.
- **Expected:** mismatch detected and reported clearly. Specific version numbers named.

## ILC-002 — `app register` then `app list`

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** application management lifecycle used by operators.
- **Steps:**
  1. Register a new application with `cartesi-rollups-cli app register`.
  2. List applications with `cartesi-rollups-cli app list`.
- **Expected:** registered application appears with `ENABLED` status. Pagination flags (`--limit`, `--offset`) return correct slices.

## ILC-003 — `app remove` transitions app to DISABLED

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** operator decommission flow; CI doesn't manage app lifecycle via the operator CLI.
- **Steps:**
  1. Register an application.
  2. Remove it with `cartesi-rollups-cli app remove`.
  3. Check status.
- **Expected:** application transitions to `DISABLED` in the database. Services stop processing it.

## ILC-004 — `validate` confirms notice proof on-chain

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** real on-chain proof verification via operator CLI; not covered by the developer CLI path.
- **Steps:**
  1. Process an input that generates a notice.
  2. Run `cartesi-rollups-cli validate` with the notice reference.
- **Expected:** Merkle proof validated successfully against the on-chain contract. Receipt returned.

## ILC-005 — `execute` executes voucher on-chain

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** real on-chain voucher execution via operator CLI.
- **Steps:**
  1. Process an input that generates a voucher.
  2. Run `cartesi-rollups-cli execute` with the voucher reference.
- **Expected:** voucher executed on-chain. Transaction receipt returned.

## ILC-006 — `send --hex --no-wait` flag combination

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** flag interaction; the no-wait send path is not exercised by CI's lifecycle tests, which wait for receipts.
- **Steps:**
  1. Send a hex-encoded payload with `cartesi-rollups-cli send --hex --no-wait`.
  2. Run the same command with the removed `--async` flag.
- **Expected:** (1) payload accepted and decoded correctly; the command returns the transaction hash without waiting for a receipt. (2) rejected as an unknown flag with a clear message.
- **Notes:**
  - alpha.13 replaced `--async` with `--no-wait` (cartesi/rollups-node#798, "unify transaction submission"). Scripts using `--async` break on upgrade.

---

## ILC-007 — `deploy quorum` creates a v3 Quorum consensus

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** v3 Quorum factory deployment; CI uses pre-deployed contracts, not this command.
- **Steps:**
  1. Run `cartesi-rollups-cli deploy quorum` with valid operator addresses and threshold.
  2. Query the returned Quorum address to confirm it was registered with the factory.
- **Expected:** Quorum contract deployed. Address printed and confirmed on-chain. Deployment is replayable with same arguments.

## ILC-008 — `deploy application` with v3 flags

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** `--claim-staging-period` and `--withdrawal-config` flags are new; CI does not exercise them.
- **Steps:**
  1. Deploy with `--claim-staging-period <N>`.
  2. Deploy with `--withdrawal-config-file <file>` pointing to a valid JSON config.
  3. Deploy with a partial (invalid) withdrawal config and confirm it is rejected.
- **Expected:** (1) claim staging period stored; (2) withdrawal config columns populated with all five typed fields; (3) partial config fails fast with a clear error before any on-chain transaction.

## ILC-009 — `read epochs` shows v3 epoch states

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** new staged and foreclosed epoch states visible only after the lifecycle runs; CI does not inspect via the operator CLI.
- **Steps:**
  1. Run a node through a normal staging cycle.
  2. Run `cartesi-rollups-cli read epochs <app>`.
  3. Foreclose the application and run `read epochs` again.
- **Expected:** (1) epochs appear with `CLAIM_SUBMITTED`, `CLAIM_STAGED`, `CLAIM_ACCEPTED` states as the cycle progresses; (2) after foreclosure the affected epoch reports `CLAIM_FORECLOSED`.

## ILC-010 — `contract` output shows v3 fields

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** JSON shape of the contract output changed; CI does not assert the full field set.
- **Steps:**
  1. Register and configure an application with a withdrawal config and guardian.
  2. Run `cartesi-rollups-cli contract <app>` (or equivalent read command).
- **Expected:** Output includes `enabled`, `status`, `claim_staging_period`, `withdrawal_config`, `foreclose_block`, `accounts_drive_proved_block`. No old single-state field present.

## ILC-011 — Transaction gas limit is estimated by default; override via `CARTESI_BLOCKCHAIN_GAS_LIMIT`

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** CI runs against a permissive local Anvil chain regardless of gas limit strategy; the estimate-vs-override behavior needs a real RPC provider to matter.
- **Steps:**
  1. Submit a transaction via the operator CLI without setting `CARTESI_BLOCKCHAIN_GAS_LIMIT` and confirm the gas limit used is estimated by the client, not a hardcoded value.
  2. Set `CARTESI_BLOCKCHAIN_GAS_LIMIT` to a non-zero value and repeat; confirm the configured value is used instead of the estimate.
- **Expected:** (1) transaction succeeds with an estimated gas limit; (2) transaction uses the configured override exactly.

## ILC-012 — Self-hosted deployment failure preserves the original transaction error cause

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** error-message fidelity on a failing deployment transaction is a UX concern CI doesn't assert on.
- **Steps:**
  1. Trigger a self-hosted application deployment that will fail on-chain (e.g. invalid constructor argument or insufficient funds).
  2. Inspect the error surfaced by the CLI.
- **Expected:** the CLI reports the original on-chain revert reason, not a generic or masked error.


## ILC-013 — `refund` returns an unfinalized deposit after foreclosure

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** new command in alpha.13 (#798). CI covers the refund lifecycle on anvil (`TestRefundLifecycle`); this is the operator path on a real chain, exporting the input through JSON-RPC as the command's own example does.
- **Steps:**
  1. Foreclose an application that has at least one deposit that is not finalized (see FOR-024).
  2. Export that deposit's complete input through JSON-RPC and run `cartesi-rollups-cli refund <app> <input-index>`.
  3. Run it again for the same input, and once for a finalized deposit.
- **Expected:** (2) success is reported only after the `RefundIssued` event for that index, and the depositor receives the funds. (3) both are rejected by the contract with a clear message.

## ILC-014 — Recovery commands confirm before acting and explain a FAILED app

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** alpha.13 moved `foreclose`, `provedriveroot` and `withdraw` to the shared transaction path, requires the matching event before reporting success, and explains when FAILED blocks foreclosure work (#798). Operator UX, not asserted by CI.
- **Steps:**
  1. Run `foreclose`, `provedriveroot` and `withdraw` without `--yes`, then with it.
  2. With an application in FAILED state, run them again and check `app status`.
- **Expected:** (1) each asks for confirmation and says what it will do; results go to stdout, progress to stderr. (2) the status output explains that FAILED blocks foreclosure work and what repair is needed before clearing it.

## ILC-015 — Deploy an application with a direct InputBox

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** new deploy path in alpha.13 (#798); CI deploys on anvil only. The CLI side of DEP-006.
- **Steps:**
  1. Deploy and register an Authority, a Quorum and a PRT application with `cartesi-rollups-cli deploy application` against the alpha.10 factories.
  2. Repeat one deploy with `--no-wait`.
- **Expected:** (1) each application is deployed, registered and processes an input. (2) the command prints the factory-predicted address and does not register it as confirmed; registration happens only after a successful receipt.

## ILC-016 — `send` and `execute` by address, without database access

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** alpha.13 lets `send` and `execute --proof-file` run without the node's database or API (#798). That is how anyone outside the operator's machine uses the CLI.
- **Steps:**
  1. From a machine with no database access, `send` an input by application address.
  2. Save an output and its proof to a file and run `execute --proof-file`.
  3. Pipe the stdout of both commands into another program.
- **Expected:** both succeed and report success only after the matching on-chain event; stdout carries only the result, so piping works.

## ILC-017 — `read` shows PRT match advance events

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** new read command in alpha.13 (#798) for following disputes from the operator CLI.
- **Steps:**
  1. Run a dispute between the sling node and an adversary on a PRT application.
  2. Read the match advance events with the CLI.
- **Expected:** every on-chain match advance appears, in order, with values matching the chain.

---

<!-- Add entries for execution-parameters set/get and db init when those paths become operator-relevant. -->
