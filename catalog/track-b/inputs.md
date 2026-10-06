# Inputs

Tests for input handling: generic payloads, ETH deposits, ERC20/ERC721/ERC1155 deposits, and custom data fields.

> **Note:** standard deposits of each token type are likely covered by CI. Keep manual entries focused on boundaries, malformed data, and multi-wallet/race scenarios.

---

## INP-001 — Deposit with massive `execLayerData`

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** gas-limit and VM-extraction boundary; real-network gas conditions matter.
- **Steps:**
  1. Construct a deposit with `execLayerData` sized near the practical upper bound.
  2. Submit on-chain.
- **Expected:** either accepted and processed correctly, or rejected with a clear error. No silent truncation, no node crash.

## INP-002 — Malformed / empty payload

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** error-handling UX; node should not crash on garbage input.
- **Steps:**
  1. Send an input with an empty payload.
  2. Send an input with clearly malformed bytes for the relevant encoding.
- **Expected:** input reaches the app, app's error response surfaces cleanly. Node stays healthy.

## INP-003 — Same-block inputs from multiple wallets

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** ordering under real mempool conditions differs from deterministic CI.
- **Steps:**
  1. From two separate wallets, submit inputs in the same block.
- **Expected:** both inputs processed in the on-chain ordering. No duplication, no dropped input.

## INP-004 — ERC721 with malformed metadata

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** app-logic-dependent; needs human judgment on whether observed behavior is correct.
- **Steps:**
  1. Deposit an ERC721 with malformed or unexpected metadata bytes.
- **Expected:** input accepted by the contract; app's response is consistent with its defined handling. Document the observed behavior.

## INP-005 — Direct InputBox input with massive payload

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** stress-level payload sizing through direct `InputBox.addInput` is expensive and environment-sensitive.
- **Steps:**
  1. Craft a direct InputBox input payload near practical transaction-size limits.
  2. Submit `addInput` on-chain for the target app.
  3. Read the processed input from node APIs.
- **Expected:** L1 accepts the transaction, the node advances the machine, and the app receives the exact payload bytes (no truncation or mutation).

## INP-006 — Multiple inputs in one transaction (spambox-style)

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** multi-input same-tx ingress depends on custom contract behavior and ordering semantics not covered in standard pipelines.
- **Steps:**
  1. Use a custom smart contract that calls `InputBox.addInput` multiple times in a single transaction.
  2. Submit the transaction while node services are running normally.
  3. Verify node processing order and completeness.
- **Expected:** L1 accepts the transaction and the node keeps up, processing every input in on-chain order with no drops/duplication.

## INP-007 — Deposit USDC into application

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** token-specific bridge wiring and live token behavior are integration-level and chain-dependent.
- **Steps:**
  1. Configure USDC token and portal addresses for the target environment.
  2. Deposit USDC to the application via the appropriate portal flow.
  3. Observe node input ingestion and app-level handling.
- **Expected:** L1 accepts the deposit, node feeds the machine, and the machine reports a successful USDC deposit.

## INP-008 — Request USDC withdrawal in application logic

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** depends on app-specific withdrawal request encoding plus live portal/token contract integration.
- **Steps:**
  1. Submit an app input that requests a USDC withdrawal.
  2. Inspect produced outputs for the expected withdrawal voucher.
- **Expected:** L1 accepts the input transaction, node feeds the machine, and the machine reports a successful USDC withdrawal request.

## INP-009 — Inputs identified and filtered by transaction hash + log index

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** the repository now identifies inputs by `(transaction hash, log index)` instead of a simpler key; CI's fixtures don't stress multi-input-per-tx filtering.
- **Steps:**
  1. Use a custom contract to submit two or more inputs for the same application in a single transaction.
  2. List/filter inputs by that transaction hash via JSON-RPC.
- **Expected:** every input from the transaction is returned, each with a distinct log index, correctly ordered. No input is merged, dropped, or duplicated.


## INP-010 — A missing input log is caught by the sealed epoch window check

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** alpha.13 validates every sealed epoch window against the on-chain input count and reports conflicting input identities instead of retrying forever (#798, "verify sealed epoch windows"). CI's anvil never drops or alters logs.
- **Steps:**
  1. Put a proxy in front of the RPC that drops one `InputAdded` log from one `eth_getLogs` response.
  2. Separately, have the proxy return an altered log for an input the node already stored.
- **Expected:** (1) the node detects the count mismatch for that window, does not move its cursor past it, and recovers once the proxy stops dropping. (2) the application is marked CORRUPTED with a clear error (alpha.13 has no general reorg rollback), not an endless retry. The sling node documents that it does not make this check (`qa-slingnode-catalog` PRV-004); the two results together are the stack comparison.


## INP-011 — Input sent between stage and accept lands in the next epoch

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** with PRT staging (alpha.13, #798) the next epoch's input bound is sampled at acceptance, not at staging. Users who expect their input in the epoch being staged will be surprised; CI does not assert this from a user's point of view.
- **Steps:**
  1. On a PRT application with a non-zero staging period, send an input after the epoch's result is staged and before it is accepted.
  2. Read the input's epoch through JSON-RPC once both epochs settle.
- **Expected:** the input belongs to the next sealed epoch and its outputs are only provable after that epoch is accepted.

---

<!-- Add entries for fee-on-transfer tokens, boundary deposit amounts, and other edge cases
     as the team identifies manual-worthy tests. -->
