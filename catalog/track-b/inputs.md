# Inputs

Tests for input handling: generic payloads, ETH deposits, ERC20/ERC721/ERC1155 deposits, and custom data fields.

> **Note:** standard deposits of each token type are likely covered by CI. Keep manual entries focused on boundaries, malformed data, and multi-wallet/race scenarios.

---

## INP-002 — Deposit with massive `execLayerData`

- **Track:** B
- **Risk:** M
- **Why-not-CI:** gas-limit and VM-extraction boundary; real-network gas conditions matter.
- **Steps:**
  1. Construct a deposit with `execLayerData` sized near the practical upper bound.
  2. Submit on-chain.
- **Expected:** either accepted and processed correctly, or rejected with a clear error. No silent truncation, no node crash.

## INP-003 — Malformed / empty payload

- **Track:** B
- **Risk:** M
- **Why-not-CI:** error-handling UX; node should not crash on garbage input.
- **Steps:**
  1. Send an input with an empty payload.
  2. Send an input with clearly malformed bytes for the relevant encoding.
- **Expected:** input reaches the app, app's error response surfaces cleanly. Node stays healthy.

## INP-004 — Same-block inputs from multiple wallets

- **Track:** B
- **Risk:** M
- **Why-not-CI:** ordering under real mempool conditions differs from deterministic CI.
- **Steps:**
  1. From two separate wallets, submit inputs in the same block.
- **Expected:** both inputs processed in the on-chain ordering. No duplication, no dropped input.

## INP-005 — ERC721 with malformed metadata

- **Track:** B
- **Risk:** L
- **Why-not-CI:** app-logic-dependent; needs human judgment on whether observed behavior is correct.
- **Steps:**
  1. Deposit an ERC721 with malformed or unexpected metadata bytes.
- **Expected:** input accepted by the contract; app's response is consistent with its defined handling. Document the observed behavior.

---

<!-- Add entries for fee-on-transfer tokens, boundary deposit amounts, and other edge cases
     as the team identifies manual-worthy tests. -->
