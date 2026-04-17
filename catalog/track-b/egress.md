# Egress & Execution

Tests for voucher execution on L1, notice validation, and L2-to-L1 finalization.

> **Note:** this area requires real testnets and cannot be meaningfully covered by CI. Keep the catalog focused here.

---

## EGR-002 — Execute same voucher twice

- **Risk:** H
- **Why-not-CI:** replay protection on real L1.
- **Steps:**
  1. Execute a voucher successfully.
  2. Attempt to execute the same voucher again.
- **Expected:** second attempt reverts with a clear reason.

## EGR-003 — Validate notice and execute voucher with `block: latest` vs `finalized`

- **Risk:** M
- **Why-not-CI:** behavior differs by mode; needs human check on both. Applies to both notice validation and voucher execution — confirm both operations work in each mode.
- **Steps:**
  1. Validate the same notice once with `block: latest` and once with `block: finalized`.
  2. Execute a voucher with `block: latest` and then with `block: finalized`.
- **Expected:** all four calls succeed under expected conditions. Document any latency difference between modes.

## EGR-004 — Execute with insufficient L1 gas

- **Risk:** M
- **Why-not-CI:** real-gas failure mode.
- **Steps:**
  1. Execute a voucher with a gas limit set below what's needed.
- **Expected:** clean revert; no inconsistent state on the node.

## EGR-005 — Withdraw more than available balance

- **Risk:** M
- **Why-not-CI:** on-chain revert handling; real L1 state required.
- **Steps:**
  1. Generate a withdrawal voucher for an amount exceeding the app contract's balance.
  2. Execute the voucher on-chain.
- **Expected:** transaction reverts cleanly on L1. Node records the failed execution without inconsistent state.

---

<!-- Add entries for voucher execution per token type (ETH, ERC20, ERC721, ERC1155 single/batch)
     as needed. Prior cycle covered the standard cases; focus on edges now. -->
