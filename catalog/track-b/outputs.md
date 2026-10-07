# Outputs

Tests for VM outputs: notices, vouchers, reports, and inspect responses.

> **CI covers:** `TestEchoAuthorityLifecycle` and its PRT variant verify that a normal accepted input produces exactly one voucher, one delegatecall voucher, and one notice, that Merkle proofs are generated, and that the voucher executes and the notice validates on-chain — all on Anvil. Manual tests here focus on boundary sizes, error paths, and diagnostic visibility that CI's echo-dapp does not exercise.

---

## OUT-001 — Oversized notice (>2MB)

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** boundary behavior at the VM output layer; error path not exercised by CI's echo-dapp.
- **Steps:**
  1. From inside the VM, emit a notice larger than 2MB.
- **Expected:** emission fails with a clear error. HTTP 400 returned. Advancer marks the input rejected. Node does not crash.

## OUT-002 — Emit a notice at the 2 MiB output limit (the limit applies to the ABI-encoded output, so the largest notice payload is 2,097,056 B): accepted and fully retrievable; one byte more is rejected

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** off-by-one territory at the machine output buffer; the usable payload is smaller than 2 MiB because the notice is ABI-encoded (4-byte selector, offset and length words, 32-byte padding), and CI does not emit outputs anywhere near that size.
- **Steps:**
  1. From inside the VM, emit a notice whose payload is exactly 2,097,056 bytes of a known pattern (for example byte `i` = `i & 0xff`).
  2. Fetch it with `cartesi_getOutput` (one output per call: two outputs of this size exceed the 10 MiB JSON-RPC response budget of a list call) and with `cartesi-rollups-cli read outputs $APP <index> --jsonrpc`.
  3. Check that the payload matches the pattern byte for byte and that `keccak256(raw_data)` equals the output hash.
  4. Emit a notice with a 2,097,057-byte payload.
- **Expected:** (1) the 2,097,056-byte notice is accepted and stored; (2)–(3) both surfaces return the full payload, byte-exact, with a matching hash. (4) the 2,097,057-byte notice is rejected by the output buffer (the emit call fails, the input is rejected) and the node stays healthy.

## OUT-003 — Voucher with invalid destination

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** execution failure handling on-chain; needs real testnet.
- **Steps:**
  1. Generate a voucher targeting a contract/method that will revert.
  2. Attempt execution on-chain.
- **Expected:** execution reverts cleanly. Voucher state reflects the failure; node remains healthy.

## OUT-004 — Report during advance and during inspect

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** diagnostic visibility; confirm reports surface in both contexts.
- **Steps:**
  1. Generate a report during advance-state processing.
  2. Generate a report during inspect-state processing.
- **Expected:** both reports retrievable via the appropriate API.

## OUT-005 — Emit arbitrary blob output and fetch via JSON-RPC

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
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


## OUT-007 — Reports from rejected inputs are kept and retrievable

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** alpha.13 keeps reports from rejected and terminal inputs (#801). Before that, a rejected input's reports were dropped, and that is usually where an app explains why it rejected.
- **Steps:**
  1. Send an input that the app rejects after emitting one or more reports.
  2. Query that input's reports through JSON-RPC and the CLI.
- **Expected:** every report comes back with the right input index; no notice or voucher from the rejected input does.

## OUT-008 — Reports from a terminal input are kept

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** same change (#801) for inputs that end the machine in a terminal state.
- **Steps:**
  1. Make an app emit a report and then raise an unhandled exception on the same input (see TRM-001).
  2. Query reports for that input.
- **Expected:** the report emitted before the exception is retrievable.

## OUT-009 — One input with a very large number of outputs and reports

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** alpha.13 stores large output and report sets with PostgreSQL `COPY` (#801). A per-input set large enough to hit database limits was flagged by static analysis in the a13-stack cycle (NREG-01) as a possible crash-loop; this is the standing check.
- **Steps:**
  1. Send one input that emits 20,000 small reports, and another that emits 20,000 small notices.
  2. Restart the node after each is processed.
- **Expected:** both persist completely (counts match through JSON-RPC), the node does not crash or crash-loop, and the restart does not process them again.

---

<!-- Add voucher-by-token-type entries, replay protection tests, etc. -->
