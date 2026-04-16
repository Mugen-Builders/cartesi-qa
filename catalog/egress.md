# Egress & Execution

Tests for voucher execution on L1, notice validation, and L2-to-L1 finalization.

> **Note:** this area requires real testnets and cannot be meaningfully covered by CI. Keep the catalog focused here.

---

## EGR-001 — Smoke: validate notice + execute voucher on testnet

- **Track:** A
- **Risk:** H
- **Why-not-CI:** real L1 interaction per release.
- **Steps:**
  1. Generate a notice and a voucher via normal input processing.
  2. Validate the notice on-chain (block: `finalized`).
  3. Execute the voucher on-chain.
- **Expected:** both on-chain interactions succeed. Voucher executor receives expected effect.

## EGR-002 — Execute same voucher twice

- **Track:** B
- **Risk:** H
- **Why-not-CI:** replay protection on real L1.
- **Steps:**
  1. Execute a voucher successfully.
  2. Attempt to execute the same voucher again.
- **Expected:** second attempt reverts with a clear reason.

## EGR-003 — Validate notice with `block: latest` vs `finalized`

- **Track:** B
- **Risk:** M
- **Why-not-CI:** behavior differs by mode; needs human check on both.
- **Steps:**
  1. Validate the same notice once with `block: latest` and once with `block: finalized`.
- **Expected:** both succeed under expected conditions. Document any latency difference.

## EGR-004 — Execute with insufficient L1 gas

- **Track:** B
- **Risk:** M
- **Why-not-CI:** real-gas failure mode.
- **Steps:**
  1. Execute a voucher with a gas limit set below what's needed.
- **Expected:** clean revert; no inconsistent state on the node.

---

<!-- Add entries for voucher execution per token type (ETH, ERC20, ERC721, ERC1155 single/batch)
     as needed. Prior cycle covered the standard cases; focus on edges now. -->
