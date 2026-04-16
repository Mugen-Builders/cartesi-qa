# Deployment

Tests for deploying applications across environments: local Anvil, self-hosted nodes, fly.io, and public testnets.

> **Note:** cross-environment behavior is uniquely manual. CI runs in one environment; real operators run in many.

---

## DEP-001 — Smoke: deploy to one live testnet

- **Track:** A
- **Risk:** H
- **Why-not-CI:** real-testnet sanity per release. Rotate which testnet based on what's most relevant.
- **Steps:**
  1. Deploy to the chosen testnet (Base Sepolia, Optimism Sepolia, or Arbitrum Sepolia).
  2. Confirm app is reachable and processes a test input.
- **Expected:** deployment completes, app responds to inputs.

## DEP-002 — Deploy to local Anvil

- **Track:** B
- **Risk:** M
- **Why-not-CI:** local-devnet path that developers use constantly.
- **Steps:**
  1. Deploy to a local Anvil chain.
- **Expected:** deployment completes. App addresses reported correctly.

## DEP-003 — Machine hash matches across environments

- **Track:** B
- **Risk:** H
- **Why-not-CI:** determinism verification across build environments.
- **Steps:**
  1. Build the same app on two different machines.
  2. Compare `cartesi hash` output.
- **Expected:** identical hashes.

## DEP-004 — Self-hosted deployment on testnet

- **Track:** B
- **Risk:** M
- **Why-not-CI:** operator flow; must be run manually.
- **Steps:**
  1. Complete a self-hosted deployment on a public testnet.
- **Expected:** all services boot, app is reachable, node processes inputs.

---

<!-- Add entries for specific testnet quirks, deploy-failure paths, etc. -->
