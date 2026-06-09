# Services

Tests for individual node services: advancer, claimer, evm-reader, validator, jsonrpc-api, database, prt.

> **Note:** basic "does the service boot" tests are covered by CI. Keep manual entries focused on restart behavior, graceful shutdown, and inter-service dependencies. Known open issues go in `../regression-watch.md`, not here.
>
> **Scope boundary:** service behavior tied to foreclosure and emergency withdrawal recovery is covered in `track-b/foreclose.md`.

---

## SVC-001 — Clean restart of each service individually

- **Risk:** M
- **Environment:** devnet
- **Why-not-CI:** per-service restart behavior matters to operators.
- **Steps:**
  1. For each service (advancer, claimer, evm-reader, validator, jsonrpc-api, database, prt):
     a. Restart just that service while the node is otherwise idle.
     b. Observe its reconnection to others.
     c. Send a small workload to confirm normal operation.
- **Expected:** service restarts cleanly, reconnects, resumes work.

## SVC-002 — Dirty restart of each service with active workload

- **Risk:** H
- **Environment:** devnet
- **Why-not-CI:** partial-failure recovery under real conditions; CI restart tests use minimal input counts and do not apply concurrent load.
- **Steps:**
  1. For each service (advancer, claimer, evm-reader, validator, jsonrpc-api, database, prt):
     a. While inputs are actively being processed, hard-restart that service.
     b. Observe reconnection and recovery.
     c. Confirm processing resumes correctly and no inputs are lost or duplicated.
- **Expected:** service recovers without data loss or stuck state. Document any anomalies. (See `../regression-watch.md` RW-005 and RW-006 for known anomalies from the last cycle with evm-reader and database.)

---

<!-- Add entries for specific service failure modes as discovered. -->
