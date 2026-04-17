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

---

<!-- Add entries for specific testnet quirks, deploy-failure paths, etc. -->
