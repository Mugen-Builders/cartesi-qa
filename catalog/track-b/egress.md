# Egress & Execution

Tests for voucher execution on L1, notice validation, and L2-to-L1 finalization.

> **Note:** this area requires real testnets and cannot be meaningfully covered by CI. Keep the catalog focused here.
>
> **Scope boundary:** this file covers regular voucher/withdrawal execution. Emergency foreclosure recovery withdrawals are covered in `track-b/foreclose.md`.

---

## EGR-001 — Execute same voucher twice

- **Risk:** H
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet + testnet
- **Why-not-CI:** replay protection on real L1.
- **Steps:**
  1. Execute a voucher successfully.
  2. Attempt to execute the same voucher again.
- **Expected:** second attempt reverts with a clear reason.

## EGR-002 — Validate notice and execute voucher with `block: latest` vs `finalized`

- **Risk:** M
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet + testnet
- **Why-not-CI:** behavior differs by mode; needs human check on both. Applies to both notice validation and voucher execution — confirm both operations work in each mode.
- **Steps:**
  1. Validate the same notice once with `block: latest` and once with `block: finalized`.
  2. Execute a voucher with `block: latest` and then with `block: finalized`.
- **Expected:** all four calls succeed under expected conditions. Document any latency difference between modes.

## EGR-003 — Execute with insufficient L1 gas

- **Risk:** M
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet + testnet
- **Why-not-CI:** real-gas failure mode.
- **Steps:**
  1. Execute a voucher with a gas limit set below what's needed.
- **Expected:** clean revert; no inconsistent state on the node.

## EGR-004 — Withdraw more than available balance

- **Risk:** M
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet + testnet
- **Why-not-CI:** on-chain revert handling; real L1 state required.
- **Steps:**
  1. Generate a withdrawal voucher for an amount exceeding the app contract's balance.
  2. Execute the voucher on-chain.
- **Expected:** transaction reverts cleanly on L1. Node records the failed execution without inconsistent state.

## EGR-005 — Validate arbitrary-blob output proof

- **Risk:** H
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet + testnet
- **Why-not-CI:** proof validation for non-standard output payloads is not exercised by current CI happy-path cases.
- **Steps:**
  1. Produce an arbitrary blob output from the app.
  2. Generate output validity proof material.
  3. Validate the output on L1.
- **Expected:** L1 accepts the output validity proof for the arbitrary blob output.

## EGR-006 — Attempt to execute non-executable outputs

- **Risk:** H
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet + testnet
- **Why-not-CI:** execution-path rejection for invalid output classes is safety-critical and requires explicit adversarial checks.
- **Steps:**
  1. Attempt output execution using an empty output.
  2. Attempt output execution using a notice.
  3. Attempt output execution using an arbitrary blob output.
- **Expected:** each attempt is rejected on L1 with a clear error message; node records each failure cleanly.

## EGR-007 — Validate USDC withdrawal voucher

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** token-specific voucher validity path depends on live deployment contracts and bridge configuration.
- **Steps:**
  1. Produce a USDC withdrawal voucher from app execution.
  2. Generate validity proof material.
  3. Validate voucher on the application contract.
- **Expected:** L1 accepts the proof and marks the voucher as valid.

## EGR-008 — Execute USDC withdrawal voucher

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** end-to-end USDC egress execution requires full L1 integration and token balances.
- **Steps:**
  1. Use a previously validated USDC withdrawal voucher.
  2. Execute the voucher on-chain.
  3. Confirm node execution status through operator/API reads.
- **Expected:** L1 accepts the execution transaction and the node marks the output as executed.

## EGR-009 — Attempt Ether withdrawal above app-contract balance

- **Risk:** H
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet + testnet
- **Why-not-CI:** negative-path revert messaging and node-side failed-execution recording are not fully covered in CI.
- **Steps:**
  1. Produce an Ether withdrawal output for more than the app contract owns.
  2. Execute the output on L1.
- **Expected:** L1 reverts with a clear error message and node records the failed execution cleanly.

## EGR-010 — Attempt ERC-721 withdrawal for token not owned by app

- **Risk:** H
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet + testnet
- **Why-not-CI:** ownership mismatch at withdrawal execution is a real integration failure mode.
- **Steps:**
  1. Produce an ERC-721 withdrawal output for a token ID the app contract does not own.
  2. Execute the output on L1.
- **Expected:** L1 reverts with a clear error message and node records the failed execution cleanly.

## EGR-011 — Attempt ERC-1155 withdrawal above app-contract balance

- **Risk:** H
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet + testnet
- **Why-not-CI:** quantity-boundary failure handling for ERC-1155 egress is not represented by standard happy-path CI.
- **Steps:**
  1. Produce an ERC-1155 withdrawal output for quantity above app holdings.
  2. Execute the output on L1.
- **Expected:** L1 reverts with a clear error message and node records the failed execution cleanly.

---

<!-- Add entries for voucher execution per token type (ETH, ERC20, ERC721, ERC1155 single/batch)
     as needed. Prior cycle covered the standard cases; focus on edges now. -->
