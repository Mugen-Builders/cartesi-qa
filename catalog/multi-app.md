# Multi-App & Consensus

Tests for running multiple applications on a single node, consensus modes (Authority, Quorum, PRT).

> **Note:** the prior cycle found a fair-scheduling regression here (heavy app starving light app on restart). This area is under-tested by CI — prioritize it.

---

## MA-001 — Two apps on same node, both processing

- **Track:** B
- **Risk:** H
- **Why-not-CI:** scheduling fairness is hard to assert in CI.
- **Steps:**
  1. Deploy two applications to one node.
  2. Send inputs to both.
- **Expected:** both apps process inputs. No starvation.

## MA-002 — Heavy app does not starve light app

- **Track:** B
- **Risk:** H
- **Why-not-CI:** regression of a previously filed bug; re-verify each release.
- **Steps:**
  1. Deploy a compute-heavy app and a light app on the same node.
  2. Load both with inputs.
- **Expected:** light app continues to progress at a reasonable rate while the heavy app processes.

## MA-003 — Restart with multiple apps, many pending inputs

- **Track:** B
- **Risk:** H
- **Why-not-CI:** prior cycle observed the node processes all of app 1 before app 2 on restart; confirm current behavior.
- **Steps:**
  1. Queue many inputs to two apps.
  2. Restart the node.
  3. Observe processing order.
- **Expected:** document the current behavior. If serialized, note this as an ongoing concern.

---

<!-- Add Authority / Quorum / PRT consensus tests here as they come into scope. -->
