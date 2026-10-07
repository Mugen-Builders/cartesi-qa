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

## DEP-006 — Deploy against contracts alpha.10 using the inputBox factory parameter

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** the factories (`IApplicationFactory`, `ISelfHostedApplicationFactory`, the PRT app factory) take the InputBox address as a deployment parameter; CI fixtures use one canned deployment and do not check the three deployment paths against the emitted event and the deployed contract.
- **Steps:**
  1. Deploy one application per path: self-hosted (`cartesi-rollups-cli deploy application $NAME $TEMPLATE --epoch-length 5 --claim-staging-period 10`), with an existing consensus (`--consensus <address>`) through the ApplicationFactory, and PRT (`--prt`).
  2. For each, decode the `ApplicationCreated` event from the deployment receipt (`cast receipt`, `cast abi-decode`) and read `getInputBox()` on the new application (`cast call $APP 'getInputBox()(address)'`).
  3. Compare with the configured `CARTESI_CONTRACTS_INPUT_BOX_ADDRESS` and with the application record (`iinputbox_address` in `cartesi-rollups-cli app list` / `cartesi_getApplication`).
  4. Send an input to each application and confirm it is processed.
- **Expected:** all three deployments succeed; the event's `inputBox` field, `getInputBox()` and the node record all hold the configured InputBox address; each application processes its input normally.

---

<!-- Add entries for specific testnet quirks, deploy-failure paths, etc. -->
