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

### EGR-001 — Smoke: end-to-end on testnet (notice + withdrawals)

- **Risk:** H
- **Why-not-CI:** CI exercises the full egress pipeline on Anvil. This test verifies the same pipeline on a real public testnet where gas estimation, block finality, and RPC behavior differ.
- **Steps:**
  1. Generate a notice and execute a voucher on-chain. Validate the notice (block: `finalized`).
  2. Execute an ETH withdrawal voucher.
  3. Execute an ERC20 withdrawal voucher.
- **Expected:** all on-chain interactions succeed. Voucher executors receive expected effect. Notice proof accepted by contract.

---

## Deployment

### DEP-001 — Smoke: self-hosted deploy to live testnet

- **Risk:** H
- **Why-not-CI:** CI deploys to Anvil only. This confirms the self-hosted deployment path works against a real public testnet. Rotate which testnet based on what's most relevant for the release.
- **Steps:**
  1. Complete a self-hosted deployment to the chosen testnet (Base Sepolia, Optimism Sepolia, or Arbitrum Sepolia).
  2. Confirm all services boot.
  3. Send a test input and confirm the app processes it.
- **Expected:** deployment completes, all services reachable, app responds to inputs.
