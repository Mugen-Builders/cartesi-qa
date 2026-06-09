# Deployment

Tests for deploying applications across environments: local Anvil, self-hosted nodes, fly.io, and public testnets.

> **Note:** cross-environment behavior is uniquely manual. CI runs in one environment; real operators run in many.

---

## DEP-002 — Deploy to local Anvil

- **Risk:** M
- **Why-not-CI:** local-devnet path that developers use constantly.
- **Steps:**
  1. Deploy to a local Anvil chain.
- **Expected:** deployment completes. App addresses reported correctly.

## DEP-003 — Machine hash matches across environments

- **Risk:** H
- **Why-not-CI:** determinism verification across build environments.
- **Steps:**
  1. Build the same app on two different machines.
  2. Compare `cartesi hash` output.
- **Expected:** identical hashes.

## DEP-004 — Deploy to Base Sepolia

- **Risk:** H
- **Why-not-CI:** CI deploys to a controlled local environment; Base Sepolia introduces real RPC latency, funding, and finality behavior.
- **Steps:**
  1. Deploy an application to Base Sepolia.
  2. Verify all required services are healthy after deployment.
  3. Send one test input and confirm processing reaches expected output.
- **Expected:** deployment succeeds, contracts are reachable, and the app processes input correctly on Base Sepolia.

## DEP-005 — Deploy to Optimism Sepolia

- **Risk:** H
- **Why-not-CI:** Optimism Sepolia behavior (RPC/provider differences and chain conditions) must be validated on real infrastructure.
- **Steps:**
  1. Deploy an application to Optimism Sepolia.
  2. Verify all required services are healthy after deployment.
  3. Send one test input and confirm processing reaches expected output.
- **Expected:** deployment succeeds, contracts are reachable, and the app processes input correctly on Optimism Sepolia.

## DEP-006 — Deploy using forked testnet workflow

- **Risk:** H
- **Why-not-CI:** forked-chain deployment depends on real RPC forking behavior and operator configuration paths that CI does not exercise.
- **Steps:**
  1. Follow the fork tutorial flow from docs PR #320 to start the node against a forked public testnet.
  2. Deploy an application in the forked environment.
  3. Send a test input and verify claim/output progression in the forked chain context.
  4. Restart services once and confirm state and cursors recover cleanly.
- **Expected:** fork-based deployment succeeds, app processes inputs correctly, and restart preserves consistent state in the forked environment.

---

<!-- Add entries for specific testnet quirks, deploy-failure paths, etc. -->
