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

### FOR-007 — A valid accounts-drive root proof (prove-drive-root) generated for app A is rejected when submitted to app B

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** cross-application operator mistakes are hard to represent in isolated CI fixtures.
- **Steps:**
  1. Deploy two applications A and B with an accounts drive (for example the node's ERC-20 withdrawal test dapp, `make applications/erc20-withdrawal-dapp`), give them different account balances so their machine states differ, let each reach an accepted epoch, and foreclose both with the guardian: `cartesi-rollups-cli foreclose <app> --yes`.
  2. Generate A's drive-root proof for its last accepted epoch: `cartesi-rollups-machine-tool replay` of A up to that epoch, then `cartesi-rollups-machine-tool prove accounts-drive --snapshot <A snapshot> ... --out-drive-root-proof drive-root-A.json --out-withdraw-proof account-A.json` (see MTL-002). This test uses the drive-root proof (`drive-root-A.json`, submitted with `prove-drive-root` / `proveAccountsDriveMerkleRoot`), not the account withdrawal proof.
  3. Record B's recovery markers: accounts-drive root and proof transaction in `cartesi_getApplication` / `cartesi-rollups-cli app list`, `cartesi-rollups-cli read withdrawals B`, and the on-chain token balances.
  4. Submit A's proof to B: `cartesi-rollups-cli prove-drive-root B --proof-file drive-root-A.json --yes`. If the CLI stops it at gas estimation, send it again with a manual gas limit (`--gas-limit`, or `CARTESI_BLOCKCHAIN_GAS_LIMIT`) so the contract itself evaluates it.
  5. Read B's markers again. As a control, generate B's own drive-root proof the same way and submit it to B.
- **Expected:** A's proof is rejected by B (the transaction reverts with a clear error) and B's recovery markers are unchanged: no accounts-drive root recorded, no withdrawals, no balance change. B's own proof is then accepted.

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

### FOR-012 — Emergency withdrawals read through the operator CLI (read withdrawals) and JSON-RPC (cartesi_listWithdrawals / cartesi_getWithdrawal) report the same rows, order and account indexes

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** consistency between operator-facing and JSON-RPC read surfaces is primarily a UX and integration concern.
- **Steps:**
  1. Foreclose an application with an accounts drive and at least four accounts with a balance (for example the node's ERC-20 withdrawal test dapp), and prove its drive root (`cartesi-rollups-cli prove-drive-root $APP --proof-file <drive-root proof> --yes`).
  2. Execute emergency withdrawals for four accounts with distinct account indexes, in an order different from the account-index order (for example indexes 2, 0, 3, 1): `cartesi-rollups-cli withdraw $APP --proof-file <account proof> --yes`.
  3. Operator CLI: `cartesi-rollups-cli read withdrawals $APP`, `read withdrawals $APP <account index>`, `--account-index <n>`, `--limit 2 --offset 1`, `--descending`; repeat each with `--jsonrpc`.
  4. JSON-RPC: `cartesi_listWithdrawals` with no filter, with `account_index`, with `limit`/`offset` and with `descending`; `cartesi_getWithdrawal` for each withdrawn account index and for one that was never withdrawn.
  5. Compare every row with the `Withdrawal` events on chain (`cast logs`).
- **Expected:** both surfaces return the same rows with equal fields, in the same order for the same ordering and pagination parameters; each account index appears once; every row matches its on-chain `Withdrawal` event; a never-withdrawn index returns a not-found error on both surfaces.

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

## Output Protocol Violations

### FOR-027 — Application that breaks the output protocol is recovered through foreclosure and a fixed redeploy

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** CI checks the INVALID_OUTPUTS_ROOT detection (TRM-005) and foreclosure separately, with synthetic machines. This is the operator path for a real application bug: an app that emits outputs and then publishes a wrong outputs Merkle root in the tx buffer, followed by foreclosure, fund recovery and a redeploy with the fix. The end state of the node's epochs and the fate of the bad epoch's outputs are only visible end to end.
- **Steps:**
  1. Deploy an Authority application with an accounts drive and a guardian. Credit balances to two accounts with portal deposits and let that epoch be accepted.
  2. In a later epoch, send an input that makes the application emit several outputs (at least one voucher and one notice) and then write a wrong outputs Merkle root to the tx buffer (value variant; repeat with the length variant if time allows).
  3. Check the operator view: `cartesi_getApplication` and `cartesi-rollups-cli app status` show `INVALID_OUTPUTS_ROOT` with the epoch (and input) that caused it; no claim is submitted for that epoch; later inputs are not executed.
  4. Try to validate and execute the voucher and notice from the bad epoch (`cartesi-rollups-cli validate` / `execute`, or `validateOutput` / `executeOutput` directly).
  5. Foreclose with the guardian. Record the application status, the foreclosure markers and the status of every epoch after the last accepted one (`cartesi_listEpochs`), also after a node restart.
  6. Prove the accounts-drive root for the last accepted epoch and run one emergency withdrawal per account; refund any deposit that was not finalized at foreclosure (ILC-013).
  7. Deploy the same application with the bug fixed (new address) on the same node, send inputs and let an epoch be accepted.
- **Expected:**
  - Step 3: the application is in the terminal state `INVALID_OUTPUTS_ROOT`, the JSON-RPC and CLI identify the epoch, no claim is sent for it, and no later input is executed.
  - Step 4: outputs from the bad epoch never validate or execute (they are not part of any accepted claim).
  - Step 5: foreclosure succeeds and every epoch that can no longer finalize is classified `CLAIM_FORECLOSED`; none stays `CLOSED` or `OPEN` indefinitely. The state survives a restart.
  - Step 6: each account withdraws exactly its balance from the last accepted epoch, once; non-finalized deposits are refunded.
  - Step 7: the fixed application processes inputs and gets its claims accepted on the same node, unaffected by the foreclosed one.

---

## Refund Edge Cases

### FOR-028 — Refund a deposit made by a contract and, when available, an EIP-7702 account. Missing receiver hooks must revert clearly without marking the refund complete, so retry remains possible.

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** the refund output is executed in the same transaction as `issueRefund`, so a depositor contract that cannot receive the asset makes the whole refund revert; CI refunds to EOAs only.
- **Steps:**
  1. Deploy depositor contracts that deposit Ether, an ERC-721 and an ERC-1155 to the application through the portals: one set that implements the receiver hooks (`receive`, `onERC721Received`, `onERC1155Received` / `onERC1155BatchReceived`) and one set that does not.
  2. On a devnet with the Prague hardfork (`anvil --hardfork prague`), delegate an EOA to a contract without the hooks (EIP-7702, `cast send --auth`) and make the same deposits from it.
  3. Keep all these deposits unfinalized and foreclose the application (as in FOR-023).
  4. Refund each deposit with `cartesi-rollups-cli refund $APP <index> --input-file in<index>.hex --yes --json`; record the CLI error, the revert data (`cast run <tx>` or `cast call` of `issueRefund`) and `wasRefundForInputIssued(index)`.
  5. Re-delegate the EIP-7702 account to an implementation with the hooks and retry its refunds.
- **Expected:** deposits from contracts with the hooks are refunded to the contract. Where a hook is missing, `issueRefund` reverts with an error the CLI can name, nothing is paid and `wasRefundForInputIssued(index)` stays false; after the EIP-7702 account gains the hooks, the retry succeeds and pays the full amount once.

### FOR-029 — Add several inputs in one transaction. Confirm lookup by transaction hash returns all inputs, a non-deposit refund fails with UnknownInputSender, and the deposit refunds successfully.

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** a refund needs the exact input index and bytes; when one transaction adds several inputs, the operator has to find them by transaction hash, and CI does not refund inputs from a multi-input transaction.
- **Steps:**
  1. From a helper contract, in one transaction, add a plain input (`InputBox.addInput`), make an Ether deposit through the portal, and add another plain input to the application.
  2. Look the inputs up by transaction hash: `cartesi-rollups-cli read inputs $APP --transaction-hash <tx>` and `cartesi_listInputs` filtered by the same hash; note each index, log index and sender.
  3. Keep the epoch unfinalized and foreclose the application.
  4. Export each input's complete bytes and run `cartesi-rollups-cli refund $APP <index> --input-file <file> --yes --json` for a plain input, then for the deposit.
- **Expected:** both lookups return all three inputs with distinct indexes and log indexes, in on-chain order. The plain-input refund fails with `UnknownInputSender` and pays nothing; the deposit is refunded in full to its depositor.

### FOR-030 — Mine a refund and claim acceptance for the same deposit epoch in one block. Confirm exactly one succeeds and node state matches chain state.

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** a same-block race between finalizing an epoch and refunding one of its deposits depends on transaction order inside a block; CI mines one transaction per block.
- **Steps:**
  1. Deploy an application with a guardian and a short staging period; make a deposit and let its epoch's claim be staged but not accepted.
  2. On anvil, turn off automine (`cast rpc evm_setAutomine false`) once the staging period has passed.
  3. Order A: queue the guardian's `foreclose`, then `issueRefund` for the deposit (`cartesi-rollups-cli refund ... --no-wait` or `cast send`), then `acceptClaim` for that epoch (the node's, or `cast send $CONSENSUS 'acceptClaim(address,uint256,bytes32)' ...`), using fees to fix the order; mine one block (`cast rpc evm_mine`).
  4. Order B (fresh deployment): queue `acceptClaim`, then `foreclose`, then `issueRefund`; mine one block.
  5. After each, read every receipt, `wasRefundForInputIssued(index)`, the consensus events, `cartesi_listEpochs`, `cartesi-rollups-cli read epochs` and the application's foreclosure markers, also after a node restart.
- **Expected:** in each order exactly one of the refund and the claim acceptance succeeds, and the other reverts with a named error; the deposit is paid out at most once. The node's epoch status and foreclosure markers match the chain (an accepted epoch is `CLAIM_ACCEPTED`; an epoch that cannot finalize is `CLAIM_FORECLOSED`).

### FOR-031 — After foreclosure, refund unfinalized ETH, ERC-721, ERC-1155 single, and ERC-1155 batch deposits. Confirm balances and ownership return exactly and RefundIssued matches the built output.

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** the refund output for each asset type is built by the refund output builder and executed by the application; CI's refund lifecycle does not compare the emitted output with the builder's for every asset type.
- **Steps:**
  1. Deposit Ether, an ERC-721, an ERC-1155 (single) and an ERC-1155 (batch, several ids and amounts) from EOAs, in an epoch that will not be accepted before the foreclosure; record balances and token owners.
  2. Foreclose the application and save each deposit's complete input bytes.
  3. Refund each deposit with `cartesi-rollups-cli refund $APP <index> --input-file in<index>.hex --yes --json`.
  4. For each refund, decode `RefundIssued(inputIndex, input, output)` from the receipt and compare `output` with the builder's result: `cast call $(cast call $APP 'getRefundOutputBuilder()(address)') 'buildRefundOutput(address,address,bytes)(bytes)' $APP <portal> <payload>`.
  5. Record balances, `ownerOf` and `balanceOf` for every id after the refunds.
- **Expected:** each depositor gets back exactly what it deposited (Ether amount, the ERC-721 token, every ERC-1155 id and amount); the application's holdings drop by the same amounts; each `RefundIssued` carries the deposit's index, its input bytes and an output identical to the builder's.

---

<!-- Add more foreclosure-specific entries as charter findings become reproducible. -->
