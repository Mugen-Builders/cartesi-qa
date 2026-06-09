# Foreclosure and Emergency Withdrawals

Tests for the v3 foreclosure lifecycle and post-foreclosure emergency recovery path.

> **Scope boundary:**
> - Regular voucher and withdrawal execution remains in `track-b/egress.md`.
> - This file covers emergency flow after foreclosure: drive-root proof, account proof withdrawal, and related state/cursor behavior.
> - Quorum-specific vote divergence/classification tests are covered in `track-b/multi-app.md`.
> - PRT-specific paths are out of scope for this cycle.

---

## Staging

### FOR-001 — Authority staging to acceptance lifecycle (happy path)

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** lifecycle timing against real block progression and staging windows is operator-facing and hard to validate in controlled CI timing.
- **Steps:**
  1. Process inputs until claim computation is available.
  2. Trigger claim submission via the claimer.
  3. Immediately observe the on-chain state: claim should be in `STAGED` (staging happens on submit for Authority).
  4. Wait for the `claim_staging_period` blocks to elapse.
  5. Wait for the claimer to send the `acceptClaim` transaction.
  6. Observe the epoch reach `CLAIM_ACCEPTED`.
- **Expected:** Claim reaches `STAGED` immediately on submission. Acceptance tx only succeeds after the staging period elapses. Lifecycle: `CLAIM_COMPUTED -> CLAIM_SUBMITTED -> CLAIM_STAGED` (immediate) → (wait period) → `CLAIM_ACCEPTED`.

---

## Foreclosure

### FOR-002 — Foreclose before claim staging is complete

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** timing-sensitive operator action before staging is not reliably represented in CI happy-path coverage.
- **Steps:**
  1. Trigger foreclosure while claim work is still pre-staging.
  2. Observe app and epoch transitions.
- **Expected:** app transitions to `FORECLOSED` with foreclosure markers. Non-accepted claim work that cannot finalize is classified as `CLAIM_FORECLOSED`.

### FOR-003 — Foreclose during staged (not yet accepted) claim

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** staged-window timing and boundary behavior are difficult to assert deterministically in CI.
- **Steps:**
  1. Move an epoch to `CLAIM_STAGED`.
  2. Trigger foreclosure before acceptance.
  3. Observe app and epoch transitions.
- **Expected:** app transitions to `FORECLOSED` with foreclosure markers. Staged claim that cannot finalize is classified as `CLAIM_FORECLOSED`.

### FOR-004 — Foreclose after claim acceptance preserves accepted history

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** post-accept foreclosure behavior is a timing/state boundary that CI happy-path tests do not target directly.
- **Steps:**
  1. Move an epoch to `CLAIM_ACCEPTED`.
  2. Trigger foreclosure after acceptance is finalized.
  3. Inspect accepted history and post-foreclosure state.
- **Expected:** app transitions to `FORECLOSED` with foreclosure markers. Previously accepted history is preserved and not rewritten.

### FOR-005 — Foreclose authorization boundary

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** signer/key misconfiguration behavior and operator clarity are environment-dependent.
- **Steps:**
  1. Attempt foreclose with a non-guardian signer.
  2. Attempt foreclose with the guardian signer.
- **Expected:** non-guardian attempt fails clearly. Guardian attempt succeeds and records foreclosure state.

---

## Emergency Withdrawal Recovery

### FOR-006 — Wrong epoch drive-root proof is rejected

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** emergency proof material and snapshot selection errors are operational and not covered by standard lifecycle CI.
- **Steps:**
  1. Foreclose an app and identify the frozen finalized boundary.
  2. Submit `proveAccountsDriveMerkleRoot` using proof material from a different epoch.
- **Expected:** proof is rejected. No accounts-drive-root anchor is recorded.

### FOR-007 — Wrong app proof reuse is rejected

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** cross-application operator mistakes are hard to represent in isolated CI fixtures.
- **Steps:**
  1. Generate a valid drive-root proof for app A.
  2. Attempt to prove the same root/proof on app B.
- **Expected:** request is rejected and app B recovery markers remain unchanged.

### FOR-008 — Emergency withdraw before drive-root proof is rejected

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** sequencing failures in emergency procedures are mostly operational, not unit-level.
- **Steps:**
  1. Foreclose an app.
  2. Attempt account withdrawal before proving drive root.
- **Expected:** withdrawal is rejected cleanly and no withdrawal row is recorded.

### FOR-009 — Wrong epoch account proof is rejected

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** mismatched snapshot/proof handling is an operator failure mode with real proof artifacts.
- **Steps:**
  1. Prove a valid drive root for the foreclosed boundary.
  2. Attempt withdraw using account proof generated from a different epoch snapshot.
- **Expected:** withdrawal fails. No payout occurs.

### FOR-010 — Emergency withdrawal is single-use per account

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** replay resistance in emergency mode is safety-critical and must be verified against real chain execution.
- **Steps:**
  1. Execute one valid emergency withdrawal for an account.
  2. Attempt to execute the same account withdrawal again.
- **Expected:** first attempt succeeds, second fails, and account remains single-payout.

### FOR-011 — Restart and catch-up preserve emergency recovery truth

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** restart timing and event backfill under live RPC behavior are not fully represented by CI.
- **Steps:**
  1. Foreclose app and perform drive-root proof and at least one emergency withdrawal.
  2. Stop evm-reader or full node and allow blocks/events to progress.
  3. Restart services and reconcile state via API/CLI reads.
- **Expected:** no duplicated or missing foreclosure/proof/withdrawal observations. Cursors progress monotonically.

### FOR-012 — Emergency withdrawal API parity

- **Risk:** M
- **Environment:** devnet
- **Why-not-CI:** consistency between operator-facing and JSON-RPC read surfaces is primarily a UX and integration concern.
- **Steps:**
  1. Execute multiple emergency withdrawals with distinct account indexes.
  2. Read withdrawal data via operator path and JSON-RPC methods.
- **Expected:** both surfaces report consistent rows, ordering, and unique account indexes.

---

## Ops Paths

### FOR-013 — Bad emergency config fails fast and clearly

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** configuration UX and startup failure clarity are environment- and operator-path specific.
- **Steps:**
  1. Start with wrong guardian address.
  2. Start with invalid/partial withdrawal config (drive layout/output builder mismatch).
  3. Attempt emergency operations.
- **Expected:** failures are explicit and actionable. No hidden partial state is written.

### FOR-014 — Repeated accept failures do not create gas-spending loops

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** long-running retry and cost behavior under live conditions is not fully covered in CI.
- **Steps:**
  1. Create conditions that repeatedly fail claim acceptance.
  2. Observe retry behavior and app status progression.
- **Expected:** retries are bounded by configured limits. System transitions safely (for example, to `FAILED`) instead of burning gas indefinitely.

---

<!-- Add more foreclosure-specific entries as charter findings become reproducible. -->
