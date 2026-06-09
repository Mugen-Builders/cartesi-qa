# Multi-App

Tests for running multiple applications on a single node.

> **Note:** the prior cycle found a fair-scheduling regression here (heavy app starving light app on restart). This area is under-tested by CI — prioritize it.
>
> **CI covers:** `TestMultiAppIsolation` verifies that two apps deployed on one node process inputs independently, with isolated outputs, isolated reports, cross-contamination checks, and independent L1 execution. Manual tests focus on what CI's controlled Anvil environment cannot assert: real scheduling fairness under load, and restart ordering with real-world workloads.
>
> **Consensus-specific tests:** Quorum behavior lives in `track-b/quorum.md`.
>
> **Cycle note:** PRT-specific paths are out of scope for this cycle.

---

## MA-001 — Heavy app does not starve light app

- **Risk:** H
- **Environment:** devnet
- **Environment:** testnet
- **Why-not-CI:** scheduling fairness under real workloads; CI's controlled Anvil environment does not apply meaningful compute pressure.
- **Steps:**
  1. Deploy a compute-heavy app and a light app on the same node.
  2. Load both with inputs.
- **Expected:** light app continues to progress at a reasonable rate while the heavy app processes.

## MA-002 — Restart with multiple apps, many pending inputs

- **Risk:** H
- **Environment:** devnet
- **Environment:** testnet
- **Why-not-CI:** restart processing order under real workloads; CI's restart tests use small input counts.
- **Steps:**
  1. Queue many inputs to two apps.
  2. Restart the node.
  3. Observe processing order.
- **Expected:** document the current behavior. If inputs are processed serially (all app-1 then all app-2), note this as an ongoing fairness concern.

---

<!-- Add more multi-app scheduling tests here as they come into scope. -->
