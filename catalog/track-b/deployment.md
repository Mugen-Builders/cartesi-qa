# Deployment

Tests for deploying applications across environments: local Anvil, self-hosted nodes, fly.io, and public testnets.

> **Note:** cross-environment behavior is uniquely manual. CI runs in one environment; real operators run in many.

---

## DEP-001 — Deploy to local Anvil

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** local-devnet path that developers use constantly.
- **Steps:**
  1. Deploy to a local Anvil chain.
- **Expected:** deployment completes. App addresses reported correctly.

## DEP-002 — Machine hash matches across environments

- **Risk:** H
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet
- **Why-not-CI:** determinism verification across build environments.
- **Steps:**
  1. Build the same app on two different machines.
  2. Compare `cartesi hash` output.
- **Expected:** identical hashes.

## DEP-003 — Deploy to Base Sepolia

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** CI deploys to a controlled local environment; Base Sepolia introduces real RPC latency, funding, and finality behavior.
- **Steps:**
  1. Deploy an application to Base Sepolia.
  2. Verify all required services are healthy after deployment.
  3. Send one test input and confirm processing reaches expected output.
- **Expected:** deployment succeeds, contracts are reachable, and the app processes input correctly on Base Sepolia.

## DEP-004 — Deploy to Optimism Sepolia

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** Optimism Sepolia behavior (RPC/provider differences and chain conditions) must be validated on real infrastructure.
- **Steps:**
  1. Deploy an application to Optimism Sepolia.
  2. Verify all required services are healthy after deployment.
  3. Send one test input and confirm processing reaches expected output.
- **Expected:** deployment succeeds, contracts are reachable, and the app processes input correctly on Optimism Sepolia.

## DEP-005 — Deploy using forked testnet workflow

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** forked-chain deployment depends on real RPC forking behavior and operator configuration paths that CI does not exercise.
- **Steps:**
  1. Follow the fork tutorial flow from docs PR #320 to start the node against a forked public testnet.
  2. Deploy an application in the forked environment.
  3. Send a test input and verify claim/output progression in the forked chain context.
  4. Restart services once and confirm state and cursors recover cleanly.
- **Expected:** fork-based deployment succeeds, app processes inputs correctly, and restart preserves consistent state in the forked environment.

## DEP-006 — Deploy against contracts alpha.10 using the `inputBox` factory parameter

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** `IApplicationFactory`/`ISelfHostedApplicationFactory` replaced the `bytes dataAvailability` parameter with `IInputBox inputBox` (breaking change); CI fixtures on this repo were updated in lockstep and won't catch a stale node-side caller.
- **Steps:**
  1. Deploy a new application against the alpha.10 factory, passing the input box contract address.
  2. Confirm the deployment event/receipt reports the input box correctly (not a decoded `dataAvailability` byte array).
  3. Send an input and confirm the app processes it normally.
- **Expected:** deployment succeeds with the new parameter shape, the app is fully functional, and no code path still expects the old `dataAvailability` encoding.

---

<!-- Add entries for specific testnet quirks, deploy-failure paths, etc. -->
