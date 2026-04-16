# Outputs

Tests for VM outputs: notices, vouchers, reports, and inspect responses.

---

## OUT-001 — Smoke: generate one notice, one voucher

- **Track:** A
- **Risk:** H
- **Why-not-CI:** headline flow; human confirmation per release.
- **Steps:**
  1. Send an input that causes the app to emit a notice.
  2. Send an input that causes the app to emit a voucher.
  3. Confirm both appear in the node's output storage.
- **Expected:** both outputs present and queryable.

## OUT-002 — Oversized notice (>2MB)

- **Track:** B
- **Risk:** M
- **Why-not-CI:** boundary behavior; past cycles found the error path emits specific codes (`IOCTL_ROLLUP_WRITE_NOTICE` -105) worth re-verifying.
- **Steps:**
  1. From inside the VM, emit a notice larger than 2MB.
- **Expected:** emission fails with a clear error. HTTP 400 returned. Advancer marks the input rejected. Node does not crash.

## OUT-003 — Boundary notice (exactly 2MB)

- **Track:** B
- **Risk:** M
- **Why-not-CI:** classic off-by-one territory.
- **Steps:**
  1. Emit a notice of exactly 2MB.
- **Expected:** accepted. Query returns the full content.

## OUT-004 — Voucher with invalid destination

- **Track:** B
- **Risk:** M
- **Why-not-CI:** execution failure handling on-chain; needs real testnet.
- **Steps:**
  1. Generate a voucher targeting a contract/method that will revert.
  2. Attempt execution on-chain.
- **Expected:** execution reverts cleanly. Voucher state reflects the failure; node remains healthy.

## OUT-005 — Report during advance and during inspect

- **Track:** B
- **Risk:** L
- **Why-not-CI:** diagnostic visibility; confirm reports surface in both contexts.
- **Steps:**
  1. Generate a report during advance-state processing.
  2. Generate a report during inspect-state processing.
- **Expected:** both reports retrievable via the appropriate API.

---

<!-- Add voucher-by-token-type entries, replay protection tests, etc. -->
