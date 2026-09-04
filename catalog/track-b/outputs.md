# Outputs

Tests for VM outputs: notices, vouchers, reports, and inspect responses.

> **CI covers:** `TestEchoAuthorityLifecycle` and its PRT variant verify that a normal accepted input produces exactly one voucher, one delegatecall voucher, and one notice, that Merkle proofs are generated, and that the voucher executes and the notice validates on-chain — all on Anvil. Manual tests here focus on boundary sizes, error paths, and diagnostic visibility that CI's echo-dapp does not exercise.

---

## OUT-001 — Oversized notice (>2MB)

- **Risk:** M
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet + testnet
- **Why-not-CI:** boundary behavior at the VM output layer; error path not exercised by CI's echo-dapp.
- **Steps:**
  1. From inside the VM, emit a notice larger than 2MB.
- **Expected:** emission fails with a clear error. HTTP 400 returned. Advancer marks the input rejected. Node does not crash.

## OUT-002 — Boundary notice (exactly 2MB)

- **Risk:** M
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet + testnet
- **Why-not-CI:** classic off-by-one territory.
- **Steps:**
  1. Emit a notice of exactly 2MB.
- **Expected:** accepted. Query returns the full content.

## OUT-003 — Voucher with invalid destination

- **Risk:** M
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet + testnet
- **Why-not-CI:** execution failure handling on-chain; needs real testnet.
- **Steps:**
  1. Generate a voucher targeting a contract/method that will revert.
  2. Attempt execution on-chain.
- **Expected:** execution reverts cleanly. Voucher state reflects the failure; node remains healthy.

## OUT-004 — Report during advance and during inspect

- **Risk:** L
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet + testnet
- **Why-not-CI:** diagnostic visibility; confirm reports surface in both contexts.
- **Steps:**
  1. Generate a report during advance-state processing.
  2. Generate a report during inspect-state processing.
- **Expected:** both reports retrievable via the appropriate API.

## OUT-005 — Emit arbitrary blob output and fetch via JSON-RPC

- **Risk:** M
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet + testnet
- **Why-not-CI:** generic blob payload handling and retrieval shape are integration-level behavior not covered by current CI assertions.
- **Steps:**
  1. From inside the VM, emit an arbitrary blob output (non-empty bytes that are not a voucher or notice payload).
  2. Query outputs through JSON-RPC list/get methods for the input/epoch.
- **Expected:** node accepts the blob output, persists it, and returns the exact bytes through JSON-RPC without truncation or reinterpretation.

## OUT-006 — Voucher-address output filter uses its DB index (not a sequential scan)

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** query-plan correctness against the schema's expression indexes needs a real Postgres instance with `EXPLAIN`; CI's small fixtures pass either way regardless of index usage.
- **Steps:**
  1. Populate an application with a mix of vouchers, delegate-call vouchers, and notices, including some notices whose payload bytes 17–36 coincide with a real voucher/delegate-call-voucher target address.
  2. Filter outputs by that voucher address.
  3. Run `EXPLAIN` on the underlying query.
- **Expected:** only vouchers/delegate-call-vouchers targeting that address are returned — no notices with coincidentally matching payload bytes. `EXPLAIN` shows an index scan, not a sequential scan.

---

<!-- Add voucher-by-token-type entries, replay protection tests, etc. -->
