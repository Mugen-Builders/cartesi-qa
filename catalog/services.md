# Services

Tests for individual node services: advancer, claimer, evm-reader, validator, jsonrpc-api, database, prt.

> **Note:** basic "does the service boot" tests are covered by CI. Keep manual entries focused on restart behavior, graceful shutdown, and inter-service dependencies.

---

## SVC-001 — Restart each service individually

- **Track:** B
- **Risk:** M
- **Why-not-CI:** per-service restart behavior matters to operators.
- **Steps:**
  1. For each service (advancer, claimer, evm-reader, validator, jsonrpc-api, database, prt):
     a. Restart just that service.
     b. Observe its reconnection to others.
     c. Send a small workload to confirm normal operation.
- **Expected:** service restarts cleanly, reconnects, resumes work. Document any graceful-shutdown gaps (previous cycle noted jsonrpc-api does not shut down gracefully).

## SVC-002 — jsonrpc-api graceful shutdown

- **Track:** B
- **Risk:** L
- **Why-not-CI:** regression check for a previously observed behavior.
- **Steps:**
  1. Send a controlled shutdown signal to jsonrpc-api.
  2. Observe logs.
- **Expected:** clean shutdown sequence. If ungraceful, file/update an issue.

---

<!-- Add entries for specific service failure modes as discovered. -->
