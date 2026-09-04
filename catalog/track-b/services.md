# Services

Tests for individual node services: advancer, claimer, evm-reader, validator, jsonrpc-api, database, prt.

> **Note:** basic "does the service boot" tests are covered by CI. Keep manual entries focused on restart behavior, graceful shutdown, and inter-service dependencies. Known open issues go in `../regression-watch.md`, not here.
>
> **Scope boundary:** service behavior tied to foreclosure and emergency withdrawal recovery is covered in `track-b/foreclose.md`.

---

## SVC-001 — Clean restart of each service individually

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** per-service restart behavior matters to operators.
- **Steps:**
  1. For each service (advancer, claimer, evm-reader, validator, jsonrpc-api, database, prt):
     a. Restart just that service while the node is otherwise idle.
     b. Observe its reconnection to others.
     c. Send a small workload to confirm normal operation.
- **Expected:** service restarts cleanly, reconnects, resumes work.

## SVC-002 — Dirty restart of each service with active workload

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** partial-failure recovery under real conditions; CI restart tests use minimal input counts and do not apply concurrent load.
- **Steps:**
  1. For each service (advancer, claimer, evm-reader, validator, jsonrpc-api, database, prt):
     a. While inputs are actively being processed, hard-restart that service.
     b. Observe reconnection and recovery.
     c. Confirm processing resumes correctly and no inputs are lost or duplicated.
- **Expected:** service recovers without data loss or stuck state. Document any anomalies. (See `../regression-watch.md` RW-005 and RW-006 for known anomalies from the last cycle with evm-reader and database.)

## SVC-003 — KMS signer produces valid signatures on an EIP-1559 network

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** requires a real AWS KMS key and a live dynamic-fee network; CI's KMS coverage runs against LocalStack with legacy transactions.
- **Steps:**
  1. Configure the claimer (and PRT, if enabled) to sign with AWS KMS.
  2. Point it at a network with EIP-1559 active (non-zero base fee).
  3. Submit a claim/consensus transaction and confirm it lands on-chain.
- **Expected:** the transaction is signed correctly for the dynamic-fee path and is accepted on-chain. No signature-mismatch error.

## SVC-004 — KMS authentication failure delays startup instead of crash-looping

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** startup-failure timing under `CARTESI_MAX_STARTUP_TIME` with a real misconfigured KMS key isn't exercised by CI.
- **Steps:**
  1. Configure the claimer with an invalid or unreachable AWS KMS key.
  2. Start the node and observe claimer startup behavior up to `CARTESI_MAX_STARTUP_TIME`.
- **Expected:** claimer startup is delayed/retried up to the configured timeout rather than crash-looping, then fails with a clear authentication error naming the cause. Other services are unaffected.

---

<!-- Add entries for specific service failure modes as discovered. -->
