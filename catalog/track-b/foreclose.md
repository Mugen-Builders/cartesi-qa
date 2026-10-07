# Foreclosure and Emergency Withdrawals

Tests for the v3 foreclosure lifecycle and post-foreclosure emergency recovery path.

> **Scope boundary:**
> - Regular voucher and withdrawal execution remains in `track-b/egress.md`.
> - This file covers emergency flow after foreclosure: drive-root proof, account proof withdrawal, and related state/cursor behavior.
> - Quorum-specific vote divergence/classification tests are covered in `track-b/multi-app.md`.
> - Reference-node PRT service paths are in `track-b/prt.md`; the dispute game itself is covered by the sling node catalog (`Mugen-Builders/qa-slingnode-catalog`).

---

## Staging

### FOR-001 — Authority path: claim submitted and staged in the same transaction (CLAIM_COMPUTED -> CLAIM_STAGED), acceptClaim only after the staging period, then CLAIM_ACCEPTED

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** lifecycle timing against real block progression and staging windows is operator-facing and hard to validate in controlled CI timing; the exact acceptance boundary (block B + P) needs on-chain probing.
- **Steps:**
  1. Deploy an Authority application with a staging period P (for example `cartesi-rollups-cli deploy application $NAME $TEMPLATE --claim-staging-period 30 --epoch-length 5`).
  2. Send an input and poll `cartesi_listEpochs` about once per second, recording each epoch status and the block at which it changed.
  3. Read the consensus events: `cast logs --address $CONSENSUS` for `ClaimSubmitted`, `ClaimStaged` and `ClaimAccepted`; note the staging block B.
  4. While the claim is staged, send `acceptClaim(address,uint256,bytes32)` from another account (`cast send $CONSENSUS 'acceptClaim(address,uint256,bytes32)' $APP <last block> <machine hash>`).
  5. Probe the boundary with `cast call ... --block N` for N = B + P - 1 and N = B + P.
  6. Wait for the node's own `acceptClaim`.
- **Expected:** `ClaimSubmitted` and `ClaimStaged` are emitted by the same transaction in the same block; the node epoch moves `CLAIM_COMPUTED -> CLAIM_STAGED` (no intermediate status is visible for Authority). Acceptance before B + P reverts with `ClaimStagingPeriodNotOverYet`; it is allowed from B + P. The node sends `acceptClaim` only after the period, and the epoch reaches `CLAIM_ACCEPTED`.

---

## Foreclosure

### FOR-002 — Foreclose before the claim is staged: foreclosure markers set (foreclose_transaction / foreclose_block; there is no FORECLOSED app status) and work that cannot finalize is marked CLAIM_FORECLOSED

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** timing-sensitive operator action before staging is not reliably represented in CI happy-path coverage.
- **Steps:**
  1. Deploy an Authority application with a guardian in its withdrawal config.
  2. Stop the claimer so the next claim stays unsubmitted; send an input and wait until its epoch is `CLAIM_COMPUTED`.
  3. As the guardian, foreclose: `cartesi-rollups-cli foreclose $APP --yes --json`.
  4. Read the application (`cartesi-rollups-cli app status $APP`, `cartesi_getApplication`) and the epochs.
  5. Start the claimer again and re-read the epochs, the claimer account nonce and the consensus events.
- **Expected:** after the foreclosure is observed, `foreclose_block` and `foreclose_transaction` are set on the application; its `status` is unchanged by foreclosure (there is no `FORECLOSED` status). The computed epoch, and any later open epoch, become `CLAIM_FORECLOSED`. The claimer sends no claim for them (no `ClaimSubmitted`/`ClaimStaged` event, nonce unchanged) and logs that the claim was made terminal by the foreclosure.

### FOR-003 — Foreclose during a staged (not yet accepted) claim: foreclosure markers set and the staged work that cannot finalize becomes CLAIM_FORECLOSED

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** staged-window timing and boundary behavior are difficult to assert deterministically in CI.
- **Steps:**
  1. Deploy an Authority application with a guardian and a staging period long enough to act in (for example 60 blocks).
  2. Send an input and wait until its epoch is `CLAIM_STAGED` (note `staged_at_block`).
  3. As the guardian, foreclose before the period ends: `cartesi-rollups-cli foreclose $APP --yes --json`.
  4. Wait until the staging period would have ended; read the application, the epochs, the consensus events and the claimer account nonce.
  5. Try `acceptClaim` for that claim on-chain (`cast call`) after the period.
- **Expected:** `foreclose_block` and `foreclose_transaction` are set; the application `status` is unchanged by foreclosure. The staged epoch becomes `CLAIM_FORECLOSED` (keeping its `staged_at_block`); the node never sends `acceptClaim` for it; the on-chain claim stays staged and `acceptClaim` reverts with `ApplicationForeclosed`.

### FOR-004 — Foreclose after claim acceptance preserves accepted history

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** post-accept foreclosure behavior is a timing/state boundary that CI happy-path tests do not target directly.
- **Steps:**
  1. Move an epoch to `CLAIM_ACCEPTED`.
  2. Trigger foreclosure after acceptance is finalized.
  3. Inspect accepted history and post-foreclosure state.
- **Expected:** foreclosure markers (`foreclose_block`, `foreclose_transaction`) are set; the application `status` is unchanged by foreclosure. Previously accepted epochs stay `CLAIM_ACCEPTED` and accepted history is not rewritten.

### FOR-005 — Foreclose authorization boundary

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** signer/key misconfiguration behavior and operator clarity are environment-dependent.
- **Steps:**
  1. Attempt foreclose with a non-guardian signer.
  2. Attempt foreclose with the guardian signer.
- **Expected:** non-guardian attempt fails clearly. Guardian attempt succeeds and records foreclosure state.

---

## Emergency Withdrawal Recovery

### FOR-006 — Wrong epoch drive-root proof is rejected

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** emergency proof material and snapshot selection errors are operational and not covered by standard lifecycle CI.
- **Steps:**
  1. Foreclose an app and identify the frozen finalized boundary.
  2. Submit `proveAccountsDriveMerkleRoot` using proof material from a different epoch.
- **Notes:**
  - If both epochs have the same post-epoch machine state, the proof may still validate. Use epochs with different post-epoch machine states.
- **Expected:** proof is rejected. No accounts-drive-root anchor is recorded.

### FOR-007 — Wrong app proof reuse is rejected

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** cross-application operator mistakes are hard to represent in isolated CI fixtures.
- **Steps:**
  1. Generate a valid drive-root proof for app A.
  2. Attempt to prove the same root/proof on app B.
- **Expected:** request is rejected and app B recovery markers remain unchanged.

### FOR-008 — Emergency withdraw before drive-root proof is rejected

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** sequencing failures in emergency procedures are mostly operational, not unit-level.
- **Steps:**
  1. Foreclose an app.
  2. Attempt account withdrawal before proving drive root.
- **Expected:** withdrawal is rejected cleanly and no withdrawal row is recorded.

### FOR-009 — Wrong epoch account proof is rejected

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** mismatched snapshot/proof handling is an operator failure mode with real proof artifacts.
- **Steps:**
  1. Prove a valid drive root for the foreclosed boundary.
  2. Attempt withdraw using account proof generated from a different epoch snapshot.
- **Notes:**
  - If both epochs have the same post-epoch accounts drive, the proof may still validate. Use epochs with different post-epoch accounts drives.
- **Expected:** withdrawal fails. No payout occurs.

### FOR-010 — Emergency withdrawal is single-use per account

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** replay resistance in emergency mode is safety-critical and must be verified against real chain execution.
- **Steps:**
  1. Execute one valid emergency withdrawal for an account.
  2. Attempt to execute the same account withdrawal again.
- **Expected:** first attempt succeeds, second fails, and account remains single-payout.

### FOR-011 — Restart and catch-up preserve emergency recovery truth

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** restart timing and event backfill under live RPC behavior are not fully represented by CI.
- **Steps:**
  1. Foreclose app and perform drive-root proof and at least one emergency withdrawal.
  2. Stop evm-reader or full node and allow blocks/events to progress.
  3. Restart services and reconcile state via API/CLI reads.
- **Expected:** no duplicated or missing foreclosure/proof/withdrawal observations. Cursors progress monotonically.

### FOR-012 — Emergency withdrawal API parity

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** consistency between operator-facing and JSON-RPC read surfaces is primarily a UX and integration concern.
- **Steps:**
  1. Execute multiple emergency withdrawals with distinct account indexes.
  2. Read withdrawal data via operator path and JSON-RPC methods.
- **Expected:** both surfaces report consistent rows, ordering, and unique account indexes.

---

## Ops Paths

### FOR-013 — Bad emergency config fails fast and clearly

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** configuration UX and startup failure clarity are environment- and operator-path specific.
- **Steps:**
  1. Start with wrong guardian address.
  2. Start with invalid/partial withdrawal config (drive layout/output builder mismatch).
  3. Attempt emergency operations.
- **Expected:** failures are explicit and actionable. No hidden partial state is written.

### FOR-014 — Repeated accept failures do not create gas-spending loops

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** long-running retry and cost behavior under live conditions is not fully covered in CI.
- **Steps:**
  1. Create conditions that repeatedly fail claim acceptance.
  2. Observe retry behavior and app status progression.
- **Expected:** retries are bounded by configured limits. System transitions safely (for example, to `FAILED`) instead of burning gas indefinitely.

### FOR-015 — Validate/execute output from staged epoch is rejected

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** staged-versus-accepted epoch boundary enforcement requires carefully timed on-chain operations not covered by CI.
- **Steps:**
  1. Produce an output in an epoch that is still `CLAIM_STAGED` (not accepted).
  2. Attempt to validate the output proof on L1.
  3. Attempt to execute the output on L1.
- **Expected:** both operations revert with a clear error message because the epoch is not accepted.

### FOR-016 — Front-run guardian foreclosure against node claim acceptance

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** mempool race behavior between guardian foreclosure and claimer acceptance tx is non-deterministic and operator-facing.
- **Steps:**
  1. Move an epoch to staged and prepare both transactions: node-driven `acceptClaim` and guardian-driven foreclosure.
  2. Submit the guardian foreclosure transaction so it is mined first.
  3. Allow the pending `acceptClaim` transaction to be mined after foreclosure.
  4. Observe app/epoch lifecycle and node failure recording.
- **Expected:** both txs are accepted by mempool, foreclosure succeeds on L1, later `acceptClaim` reverts, node records failure cleanly, the application's foreclosure markers are set, and the staged claim is marked `CLAIM_FORECLOSED`.

### FOR-017 — Withdraw USDC after foreclosure via emergency path

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** emergency token recovery after foreclosure needs real proof artifacts and live contract execution.
- **Steps:**
  1. Foreclose an app with USDC balance attributable to a user account in the accounts drive.
  2. Prove the accounts-drive root for the foreclosed boundary.
  3. Submit account proof and execute emergency USDC withdrawal output.
- **Expected:** L1 accepts the account proof and executes the USDC withdrawal output successfully.

---

## Claim Validity Proof

### FOR-018 — Authority claim submission accepts a valid machine validity proof

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** the contracts author flags the machine validity proof libraries as the security-sensitive part of this change; the happy path establishes the baseline the FOR-019..021 rejection cases are compared against.
- **Steps:**
  1. Submit an Authority claim with a valid machine validity proof: the machine manually yielded, "RX accepted" reason.
- **Expected:** the proof is accepted and the claim reaches `STAGED`.

### FOR-019 — Authority claim submission rejects a machine that was not manually yielded (RX accepted)

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** this is one of three independently reachable rejection paths in the same proof check; each has its own error and needs its own pass/fail record.
- **Steps:**
  1. Submit an Authority claim where the machine was not yielded.
  2. Submit an Authority claim where the machine was yielded, but with a reason other than "RX accepted".
- **Expected:** both attempts revert with `InvalidPostEpochMachineIflagsYRegister` or `InvalidPostEpochMachineHtifTohostRegister` as applicable. No claim reaches `STAGED`.

### FOR-020 — Authority claim submission rejects a malformed machine Merkle proof

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** distinct from the yield-state checks (FOR-019) and the siblings-length check (FOR-021); exercises the Merkle verification itself.
- **Steps:**
  1. Submit an Authority claim with a machine validity proof whose Merkle proof is malformed or incorrect for the claimed machine state.
- **Expected:** reverts with `InvalidMachineMerkleProof`. No claim reaches `STAGED`.

### FOR-021 — Authority claim submission rejects a siblings array of the wrong length

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** boundary/structural validation on the proof's siblings array, separate from Merkle correctness (FOR-020).
- **Steps:**
  1. Submit an Authority claim with a machine validity proof whose siblings array has the wrong length.
- **Expected:** reverts with `InvalidSiblingsArrayLength`. No claim reaches `STAGED`.

---

## Deposit Refunds

### FOR-023 — Deposits after foreclosure revert at the InputBox (ApplicationForeclosed) for Ether/ERC-20/ERC-721/ERC-1155; deposits not yet finalized at foreclosure can be refunded in full to the depositor (issueRefund / cartesi-rollups-cli refund)

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** end-to-end refund behavior against a foreclosed application, across token types, needs real deployments and is not part of CI's happy-path lifecycle.
- **Steps:**
  1. Deploy an application with a guardian and a long staging period, so deposits can be made in an epoch that will not be accepted before the foreclosure.
  2. From different depositor accounts, deposit Ether, an ERC-20, an ERC-721 and an ERC-1155 (single and batch) to the application. Confirm their epoch is not `CLAIM_ACCEPTED`.
  3. Save each deposit's complete input bytes: `cartesi-rollups-cli read inputs $APP <index> --jsonrpc | jq -r .data.raw_data > in<index>.hex`.
  4. As the guardian, foreclose the application.
  5. From a gas payer that is not the depositor, refund each deposit: `cartesi-rollups-cli refund $APP <index> --input-file in<index>.hex --yes --json`. Record depositor and application balances before and after.
  6. After foreclosure, try one new deposit of each token type.
- **Expected:** each unfinalized deposit can be refunded, and is refunded in full to its original depositor (not to the caller), with a `RefundIssued` event and `wasRefundForInputIssued(index)` true; the application balance drops by the same amount. Every deposit attempted after foreclosure reverts with `ApplicationForeclosed`: no input is added and the sender keeps the tokens. No deposit is silently accepted or lost.

### FOR-024 — Deposit refund boundary: finalized vs. non-finalized input

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** the finalized/non-finalized boundary is set by which epoch consensus accepted last before the foreclosure, a timing-sensitive on-chain fact that CI's fixed-block fixtures don't naturally exercise.
- **Steps:**
  1. Deploy an application with a guardian and a USD accounts drive (the guest credits deposits to accounts).
  2. Before any foreclosure, deposit from user A and wait until that deposit's epoch is `CLAIM_ACCEPTED` (finalized).
  3. Still before foreclosure, deposit from user B in a later epoch that is not accepted (non-finalized: the staging period has not elapsed, or the claim is not yet staged).
  4. As the guardian, foreclose; confirm on chain which of the two inputs is finalized.
  5. Try `cartesi-rollups-cli refund $APP <index> --input-file <file> --yes --json` for both deposits.
  6. Generate the accounts-drive proofs from the last accepted epoch (`cartesi-rollups-machine-tool replay`, `prove accounts-drive`), run `cartesi-rollups-cli prove-drive-root`, then `cartesi-rollups-cli withdraw` for A and for B.
  7. Repeat each successful refund and withdrawal.
- **Expected:** A's finalized deposit cannot be refunded (`CannotRefundFinalizedInput`) and is recovered through the emergency withdrawal, from the accounts drive of the last accepted state. B's non-finalized deposit is refunded directly on the base layer, in full to B, and is not part of the accounts drive used for the withdrawal. Repeats are rejected; neither deposit is paid twice or dropped.

---

## Terminal Applications

### FOR-025 — Application in a terminal state is recovered through foreclosure

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** CI tests terminal states and foreclosure separately. An application stuck in a terminal state is the main reason to foreclose, so the whole operator path needs one end-to-end run.
- **Steps:**
  1. Drive an application with user balances into a terminal state (see `terminal-states.md`).
  2. Send a deposit after the terminal input.
  3. Foreclose, prove the accounts-drive root, run an emergency withdrawal for an account with balance, and refund the post-terminal deposit (ILC-013).
- **Expected:** balances credited before the terminal input can be withdrawn; the deposit sent after it is refunded; the node keeps indexing the application's L1 events throughout.


---

## Rejected Deposits

### FOR-026 — Deposit rejected by the app in an accepted epoch cannot be refunded

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** the refund path only covers deposits that were never finalized. A deposit the application rejected, in an epoch consensus accepted, is finalized: the portal already moved the funds and there is no refund. CI covers refund eligibility, not this user-visible outcome.
- **Steps:**
  1. Make the application reject a portal deposit (for example an amount its ledger refuses) in an epoch that then gets accepted.
  2. Foreclose and try `refund` for that input (ILC-019 expects `CannotRefundFinalizedInput`).
  3. Check where the funds are: the application's token balance, the accounts drive, and any voucher.
- **Expected:** refund is rejected as documented. Record that the funds sit in the application with no path back unless the app itself emitted a voucher; this is the case application developers must avoid by never rejecting portal deposits.

---

<!-- Add more foreclosure-specific entries as charter findings become reproducible. -->
