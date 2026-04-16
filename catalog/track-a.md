# Track A — Release Smoke Checklist

Run this checklist for every release candidate. One tester completes it end-to-end; the lead signs off before the release proceeds.

**Duration:** 2–3 hours  
**Failure policy:** if any test fails, stop and triage before continuing the release.

> **CI coverage note (keep this current):** The integration test suite now covers the full echo-dapp lifecycle (input → notice + delegatecall voucher + voucher → claim accepted → execute + proof validation), inspect happy path, inspect-404, reject/exception input handling, and multi-app isolation — all on Anvil. Track A focuses exclusively on what CI cannot cover: **real-testnet behavior** and **CLI UX on a real machine**. Before adding a test here, ask whether CI already asserts the same mechanics on Anvil; if yes, the only remaining manual value is the real-testnet or clean-machine angle.

---

## CLI

### CLI-005 — Smoke: `cartesi create` → `build` → `run`

- **Risk:** H
- **Why-not-CI:** CI runs in a pre-provisioned Docker environment; this verifies the flow on a real developer machine with real tooling installed.
- **Steps:**
  1. `cartesi create smoketest`
  2. `cd smoketest && cartesi build`
  3. `cartesi run`
- **Expected:** each step completes without error. `cartesi run` boots a local node reachable on default ports.

---

## Inputs

### INP-001 — Smoke: one deposit of each token type

- **Risk:** H
- **Why-not-CI:** CI integration tests use generic `send` inputs, not the deposit Portal contracts. Deposit flows (ETH / ERC20 / ERC721 / ERC1155) require end-to-end chain interaction that CI does not exercise.
- **Steps:**
  1. Deposit ETH.
  2. Deposit an ERC20.
  3. Deposit an ERC721.
  4. Deposit an ERC1155 (single).
- **Expected:** all four deposits appear as accepted inputs in the node.

---

## Egress

### EGR-001 — Smoke: validate notice + execute voucher on testnet

- **Risk:** H
- **Why-not-CI:** CI exercises the full egress pipeline on Anvil. This test verifies the same pipeline on a real public testnet where gas estimation, block finality, and RPC behavior differ.
- **Steps:**
  1. Generate a notice and a voucher via normal input processing.
  2. Validate the notice on-chain (block: `finalized`).
  3. Execute the voucher on-chain.
- **Expected:** both on-chain interactions succeed. Voucher executor receives expected effect.

---

## Deployment

### DEP-001 — Smoke: deploy to one live testnet

- **Risk:** H
- **Why-not-CI:** CI deploys to Anvil only. This confirms the deployment toolchain works against a real public testnet. Rotate which testnet based on what's most relevant for the release.
- **Steps:**
  1. Deploy to the chosen testnet (Base Sepolia, Optimism Sepolia, or Arbitrum Sepolia).
  2. Confirm app is reachable and processes a test input.
- **Expected:** deployment completes, app responds to inputs.

### DEP-004 — Self-hosted deployment on testnet

- **Risk:** M
- **Why-not-CI:** operator deployment path; CI covers fly.io/Anvil only. Self-hosted involves different infra setup steps that must be verified manually each release.
- **Steps:**
  1. Complete a self-hosted deployment on a public testnet.
- **Expected:** all services boot, app is reachable, node processes inputs.
