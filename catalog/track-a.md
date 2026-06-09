# Track A — Release Smoke Checklist

Run this checklist for every release candidate. One tester completes it end-to-end; the lead signs off before the release proceeds.

**Duration:** 2–3 hours  
**Failure policy:** if any test fails, stop and triage before continuing the release.

> **CI coverage note (keep this current):** The integration test suite now covers the full echo-dapp lifecycle (input → notice + delegatecall voucher + voucher → claim accepted → execute + proof validation), inspect happy path, inspect-404, reject/exception input handling, and multi-app isolation — all on Anvil. Track A focuses exclusively on what CI cannot cover: **real-testnet behavior** and **CLI UX on a real machine**. Before adding a test here, ask whether CI already asserts the same mechanics on Anvil; if yes, the only remaining manual value is the real-testnet or clean-machine angle.

## Canonical Execution Order (Source of Truth)

This ordered list is the source of truth for Track A execution sequence. The spreadsheet must mirror this order exactly.

1. `SMK-001` (devnet)
2. `SMK-003` (devnet)
3. `SMK-004` (devnet)
4. `SMK-005` (devnet)
5. `SMK-006` (testnet)
6. `SMK-002` (testnet)
7. `SMK-003` (testnet)
8. `SMK-004` (testnet)
9. `SMK-005` (testnet)

---

## Phase 1 — Devnet Smoke

### SMK-001 — Smoke (devnet): `cartesi create` → `build` → `run`

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** CI runs in a pre-provisioned Docker environment; this verifies the flow on a real developer machine with real tooling installed.
- **Steps:**
  1. `cartesi create smoketest`
  2. `cd smoketest && cartesi build`
  3. `cartesi run`
- **Expected:** each step completes without error. `cartesi run` boots a local node reachable on default ports.

### SMK-003 — Smoke (devnet): one deposit of each token type

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** CI integration tests use generic `send` inputs, not the deposit Portal contracts. Deposit flows (ETH / ERC20 / ERC721 / ERC1155) require end-to-end chain interaction that CI does not exercise.
- **Steps:**
  1. Deposit ETH.
  2. Deposit an ERC20.
  3. Deposit an ERC721.
  4. Deposit an ERC1155 (single).
- **Expected:** all four deposits appear as accepted inputs in the node.

### SMK-004 — Smoke (devnet): notice proof + ETH/ERC20 withdrawals

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** this confirms operator-run egress behavior end-to-end in manual local flow, not only CI harness flow.
- **Steps:**
  1. Generate a notice and execute a voucher on-chain. Validate the notice.
  2. Execute an ETH withdrawal voucher.
  3. Execute an ERC20 withdrawal voucher.
- **Expected:** all on-chain interactions succeed and effects match expected recipients/amounts.

### SMK-005 — Smoke (devnet): emergency withdrawal after foreclosure

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** validates manual emergency operator flow in local controlled environment.
- **Steps:**
  1. Foreclose a prepared app using the guardian flow.
  2. Prove accounts-drive root for the frozen finalized boundary.
  3. Execute one valid emergency account withdrawal.
  4. Attempt the same account withdrawal again.
- **Expected:** foreclosure and drive-root proof succeed, first withdrawal succeeds, second fails as already withdrawn.

---

## Phase 2 — Testnet Deploy

### SMK-006 — Smoke: self-hosted deploy to live testnet

- **Risk:** H
- **Environment:** testnet
- **Why-not-CI:** CI deploys to Anvil only. This confirms the self-hosted deployment path works against a real public testnet. Rotate which testnet based on what's most relevant for the release.
- **Steps:**
  1. Complete a self-hosted deployment to the chosen testnet (Base Sepolia, Optimism Sepolia, or Arbitrum Sepolia).
  2. Confirm all services boot.
  3. Confirm the environment is ready for post-deploy Track A testnet validation (`SMK-002`, `SMK-003`, `SMK-004`, `SMK-005`).
- **Expected:** deployment completes, all services are reachable, and contracts are ready for subsequent separate testnet smoke tests.

---

## Phase 3 — Testnet Smoke

### SMK-002 — Smoke (testnet): CLI path against deployed testnet app

- **Risk:** H
- **Environment:** testnet
- **Why-not-CI:** CI does not cover operator CLI behavior against real public testnets.
- **Steps:**
  1. Use the deployed testnet app from `SMK-006`.
  2. Run one representative CLI action against the testnet app (for example, read app state / read epochs / send one input).
- **Expected:** CLI command succeeds against testnet endpoints with clear output and no local-only assumptions.

### SMK-003 — Smoke (testnet): one deposit of each token type

- **Risk:** H
- **Environment:** testnet
- **Why-not-CI:** deposit portal behavior on real public testnets differs from local devnet conditions.
- **Steps:**
  1. On the app deployed by `SMK-006`, deposit ETH.
  2. Deposit an ERC20.
  3. Deposit an ERC721.
  4. Deposit an ERC1155 (single).
- **Expected:** all four deposits are accepted and visible in testnet processing order.

### SMK-004 — Smoke (testnet): notice proof + ETH/ERC20 withdrawals

- **Risk:** H
- **Environment:** testnet
- **Why-not-CI:** CI exercises the full egress pipeline on Anvil. This test verifies the same pipeline on a real public testnet where gas estimation, block finality, and RPC behavior differ.
- **Steps:**
  1. Generate a notice and execute a voucher on-chain. Validate the notice (block: `finalized`).
  2. Execute an ETH withdrawal voucher.
  3. Execute an ERC20 withdrawal voucher.
- **Expected:** all on-chain interactions succeed. Voucher executors receive expected effect. Notice proof accepted by contract.

### SMK-005 — Smoke (testnet): emergency withdrawal after foreclosure

- **Risk:** H
- **Environment:** testnet
- **Why-not-CI:** this validates the real operator emergency flow (foreclose -> prove drive root -> withdraw) on a live environment, including signer/proof handling that CI does not exercise end-to-end.
- **Steps:**
  1. Foreclose a prepared app using the guardian flow.
  2. Prove accounts-drive root for the frozen finalized boundary.
  3. Execute one valid emergency account withdrawal.
  4. Attempt the same account withdrawal again.
- **Expected:** foreclosure and drive-root proof succeed, first emergency withdrawal succeeds, and second withdrawal attempt fails as already withdrawn.
