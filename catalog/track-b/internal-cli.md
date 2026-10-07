# Internal Operator CLI (`cartesi-rollups-cli`)

Tests for the `cartesi-rollups-cli` operator tool: database management, application lifecycle, on-chain operations.

> **Note:** this CLI was entirely untested in the last cycle (Phase 12 all Out of Scope). CI does not cover it. Entries here focus on the operator-critical paths; exhaustive coverage of every flag is not the goal.

---

## ILC-001 — The node and cartesi-rollups-cli db check-version refuse a database whose schema differs from the binary's, before doing anything else (no deploys or writes against it)

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** database integrity; CI always starts from a fresh schema, and the "refuse before acting" ordering across node startup and DB-backed CLI commands is not asserted.
- **Steps:**
  1. Run `cartesi-rollups-cli db init` on a fresh database, then `cartesi-rollups-cli db check-version` and note the reported version.
  2. Prepare databases whose schema is not the binary's, one at a time: (a) the recorded version changed (`UPDATE schema_migrations SET version = <other value>;`); (b) the right version with `dirty = true`; (c) the right version number but a table definition changed (for example a column dropped or an extra column added to `input`).
  3. Against each, run `cartesi-rollups-cli db check-version`.
  4. Start the node against each.
  5. Run DB-backed CLI commands that would otherwise write or send transactions: `cartesi-rollups-cli deploy application $NAME $TEMPLATE` (register mode), `cartesi-rollups-cli app register ...`.
  6. Check the chain (deployer nonce, no new contracts) and the database (no new rows).
- **Expected:** (3) exits non-zero for every case with a message that says the schema is not the one the binary expects (naming the expected and found version, or the incomplete migration, or the mismatch found). (4) the node exits at startup with the same diagnosis before any service starts work: no input read, no claim, no transaction. (5) each command refuses before any on-chain transaction or database write. (6) nothing was deployed or written.

## ILC-002 — `app register` then `app list`

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** application management lifecycle used by operators.
- **Steps:**
  1. Register a new application with `cartesi-rollups-cli app register`.
  2. List applications with `cartesi-rollups-cli app list`.
- **Expected:** registered application appears with `ENABLED` status. Pagination flags (`--limit`, `--offset`) return correct slices.

## ILC-003 — cartesi-rollups-cli app status disabled then app remove: enabled=false stops processing; remove deletes only a disabled application

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** operator decommission flow; CI doesn't manage app lifecycle via the operator CLI.
- **Steps:**
  1. Register an application and send it an input.
  2. Run `cartesi-rollups-cli app remove $APP` while it is enabled.
  3. Disable it: `cartesi-rollups-cli app status $APP disabled --yes`; send another input; read `cartesi-rollups-cli app list` and `cartesi_getApplication`.
  4. Run `cartesi-rollups-cli app remove $APP` (answer the prompt, then with `--yes`).
- **Expected:** (2) refused: the application must be disabled first; nothing changes. (3) the application shows `enabled: false` (its `status` is unchanged) and services stop processing it: the new input is not executed and no claim is sent for it. (4) the registration is deleted from the database and the application no longer appears in `app list`.

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

## ILC-006 — cartesi-rollups-cli send --hex --no-wait: payload accepted, returns without a receipt

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** flag interaction; the no-wait send path is not exercised by CI's lifecycle tests, which wait for receipts.
- **Steps:**
  1. Send a hex-encoded payload with `cartesi-rollups-cli send --hex --no-wait`.
- **Expected:** payload accepted and decoded correctly; the command returns the transaction hash without waiting for a receipt.

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
- **Expected:** (1) for an Authority application, epochs move `CLAIM_COMPUTED` -> `CLAIM_STAGED` -> `CLAIM_ACCEPTED` as the cycle progresses (submission and staging happen in one transaction, so no separate submitted state is shown; a Quorum epoch shows `CLAIM_SUBMITTED` while votes are pending); (2) after foreclosure the epochs that were not accepted report `CLAIM_FORECLOSED`.

## ILC-010 — cartesi-rollups-cli app list and cartesi_getApplication show the v3 fields (enabled, status, withdrawal config, foreclose markers); contract shows the on-chain view only

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** operators read these surfaces to diagnose an application; CI does not assert the full field set of each one or the split between node-database state and on-chain state.
- **Steps:**
  1. Deploy an application with a withdrawal config (guardian, builder, accounts-drive layout) and a staging period.
  2. Run `cartesi-rollups-cli app list` (JSON) and `cartesi_getApplication`.
  3. Foreclose the application and prove its accounts-drive root (`prove-drive-root`), then repeat step 2.
  4. Run `cartesi-rollups-cli contract app $APP_ADDRESS --json` and `cartesi-rollups-cli contract consensus $CONSENSUS_ADDRESS --json`.
- **Expected:** `app list` and `cartesi_getApplication` include `enabled`, `status`, `reason`, `claim_staging_period`, `withdrawal_config` (guardian, withdrawal output builder, accounts-drive layout), `foreclose_block` / `foreclose_transaction` and `accounts_drive_proved_block` / `accounts_drive_merkle_root`, with the foreclosure and drive-proof markers filled after step 3. No old single-state field is present. `contract` takes addresses only and shows on-chain values (owner, template hash, input box, consensus, `is_foreclosed`, guardian and withdrawal config; consensus type, staging period, staged/accepted claims) and no node-database fields.

## ILC-011 — Transaction gas limit is estimated by default; override via `CARTESI_BLOCKCHAIN_GAS_LIMIT`

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** CI runs against a permissive local Anvil chain regardless of gas limit strategy; the estimate-vs-override behavior needs a real RPC provider to matter.
- **Steps:**
  1. Submit a transaction via the operator CLI without setting a gas limit (`--gas-limit 0` or unset) and confirm the limit comes from `eth_estimateGas`, not a hardcoded value.
  2. Set `CARTESI_BLOCKCHAIN_GAS_LIMIT` (or `--gas-limit`) to a non-zero value and repeat.
  3. With a manual limit, send an action that will revert (for example executing an already executed output).
  4. Set `CARTESI_BLOCKCHAIN_LEGACY_ENABLED=true` and repeat step 1.
- **Expected:** (1) estimated limit, transaction succeeds. (2) the configured value is used exactly, with no estimation. (3) without a manual limit, estimation rejects it before signing; with a manual limit, the transaction is sent and gas is spent on the revert (documented trade-off). (4) a legacy transaction with a fresh gas price.

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
- **Why-not-CI:** new command in alpha.13 (#798). CI covers the refund lifecycle on anvil (`TestRefundLifecycle`); this is the operator path on a real chain.
- **Steps:**
  1. Foreclose an application that has at least one deposit that is not finalized (see FOR-024).
  2. Find the deposit's input index (`read inputs APP --transaction-hash TX --jsonrpc`), export its complete `raw_data` to a file, and run `cartesi-rollups-cli refund APP INPUT_INDEX --input-file deposit.hex --yes --json`.
  3. Run it again for the same input.
- **Expected:** (2) success is reported only after the `RefundIssued` event for that index, and the original depositor receives the funds (the caller only pays gas). (3) rejected with `RefundAlreadyIssued`, no second payment. Rejection paths are ILC-019.
- **Notes:**
  - The index is application-wide, not epoch-relative, and the file must hold the complete `InputAdded.input` bytes. Guest payload, portal payload or decoded JSON are not interchangeable with them.

## ILC-014 — Recovery commands confirm before acting and explain a FAILED app

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** alpha.13 moved `foreclose`, `prove-drive-root` and `withdraw` to the shared transaction path and explains when FAILED blocks foreclosure work (#798). Operator UX, not asserted by CI.
- **Steps:**
  1. Run `foreclose`, `prove-drive-root` and `withdraw` without `--yes`, then with it.
  2. With an application in FAILED state, run them again and check `app status`.
- **Expected:** (1) each asks for confirmation; results go to stdout, prompts and progress to stderr. `prove-drive-root` reports success only after the `AccountsDriveMerkleRootProved` event with the submitted root; `foreclose` and `withdraw` only check the receipt status (no action-specific event), as documented. (2) the status output explains that FAILED blocks foreclosure work and what repair is needed before clearing it.

## ILC-015 — Deploy an application with a direct InputBox

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** new deploy path in alpha.13 (#798); CI deploys on anvil only. The CLI side of DEP-006.
- **Steps:**
  1. Deploy and register an Authority, a Quorum and a PRT application with `cartesi-rollups-cli deploy application` against the alpha.10 factories.
  2. Run one deploy with `--no-wait` and registration left on, then with `--no-wait --register=false`.
- **Expected:** (1) each application is deployed, registered and processes an input. (2) `--no-wait` with registration is rejected; with `--register=false` the command prints the factory-predicted address only, without confirmed metadata.

## ILC-016 — `send` and `execute` by address, without database access

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** alpha.13 lets `send` and `execute --proof-file` run without the node's database or API (#798). That is how anyone outside the operator's machine uses the CLI.
- **Steps:**
  1. From a machine with no database access, `send` an input by application address.
  2. Run `send` with an explicit `--inputbox` flag.
  3. Save an output and its proof to a file and run `execute APP_ADDRESS OUTPUT_INDEX --proof-file proof.json`.
  4. Pipe the stdout of the successful commands into another program.
- **Expected:** (1) succeeds, reading the InputBox from the application contract. (2) rejected, even if it names the right InputBox. (3) succeeds and reports success only after the matching `OutputExecuted` event. (4) stdout carries only the result, so piping works.

## ILC-017 — `read` shows PRT match advance events

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** new read command in alpha.13 (#798) for following disputes from the operator CLI.
- **Steps:**
  1. Run a dispute between the sling node and an adversary on a PRT application.
  2. Read the match advance events with the CLI.
- **Expected:** every on-chain match advance appears, in order, with values matching the chain.


## ILC-019 — `refund` rejection paths

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** the refund contract has several rejection paths and the CLI should surface each clearly; CI covers the happy lifecycle.
- **Steps:**
  1. Run `refund` for a deposit on an application that is not foreclosed.
  2. Run it for a deposit in an accepted epoch (also for one the app rejected in that epoch).
  3. Run it with the guest payload or the transaction calldata instead of the complete input bytes.
  4. Run it for an unfinalized input that did not come from a portal (a plain `addInput`).
- **Expected:** (1) `NotForeclosed`. (2) `CannotRefundFinalizedInput` in both cases. (3) `InvalidInputHash`. (4) `UnknownInputSender`. Each error is named in the CLI output, and nothing is paid.

## ILC-020 — Receipt wait timeout reports an unknown outcome

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** alpha.13 waits for a mined receipt by default (2 minutes, `--wait-timeout`). On a slow chain a timeout does not mean failure; CI's anvil mines instantly.
- **Steps:**
  1. Send a transaction with a fee low enough that it stays pending, and a short `--wait-timeout`.
  2. Check stderr and the exit result, then watch the transaction on-chain.
- **Expected:** the signed hash is printed to stderr before broadcast; the timeout is reported as an unknown outcome with that hash, not as a failed action. If the transaction later mines, nothing in the CLI output contradicted it.

## ILC-021 — `deposit erc20 --approve` checks both steps

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** dependent approval and deposit are new receipt-checked steps in alpha.13 (#798).
- **Steps:**
  1. Run `deposit erc20 --approve` with an amount that needs a new approval.
  2. Run it with `--no-wait`.
  3. Run it for a token that returns `false` on `approve` or a deposit that reverts.
- **Expected:** (1) the CLI checks the exact `Approval` event, then the matching `InputAdded` for the deposit (application, portal sender, index, payload). (2) rejected: `--approve` does not allow `--no-wait`. (3) the failing step is named and no deposit is reported.

---

<!-- Add entries for execution-parameters set/get and db init when those paths become operator-relevant. -->
