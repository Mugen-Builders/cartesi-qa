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
- **Notes:**
  - Since alpha.13 the single-process node runs every service under one supervisor (cartesi/rollups-node#785), so a single service cannot be restarted on its own there. Run this with split services (`compose.individual-services.yaml`); single-process shutdown and failure behavior is SVC-005 and SVC-006.

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
- **Notes:**
  - Since alpha.13 the single-process node runs every service under one supervisor (cartesi/rollups-node#785), so a single service cannot be restarted on its own there. Run this with split services (`compose.individual-services.yaml`); single-process shutdown and failure behavior is SVC-005 and SVC-006.
  - In alpha.13 a database failure while the advancer writes a result it already applied to the machine stops the whole node on purpose (SVC-010). A database hard-restart in this test can therefore end in a fatal exit, which is the expected behavior.

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
- **Notes:**
  - Since alpha.13 the KMS region and endpoint come from the AWS SDK settings (`AWS_REGION`, `AWS_ENDPOINT_URL_KMS`); `CARTESI_AUTH_AWS_KMS_REGION` was removed. A successful KMS sign call is not evidence of the right chain id, sender or transaction type, so also check the mined transaction.

## SVC-004 — KMS authentication failure delays startup instead of crash-looping

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** startup-failure timing under `CARTESI_MAX_STARTUP_TIME` with a real misconfigured KMS key isn't exercised by CI.
- **Steps:**
  1. Configure the claimer with an invalid or unreachable AWS KMS key.
  2. Start the node and observe claimer startup behavior up to `CARTESI_MAX_STARTUP_TIME`.
- **Expected:** claimer startup is delayed/retried up to the configured timeout rather than crash-looping, then fails with a clear authentication error naming the cause. Other services are unaffected.


## SVC-005 — Single-process node: a service that fails to start stops the whole node clearly

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** behavior change in alpha.13 (cartesi/rollups-node#785): a service initialization failure now shuts the supervisor down. CI checks the supervisor's mechanics, not what an operator sees on a real misconfiguration.
- **Steps:**
  1. Start `cartesi-rollups-node` with the JSON-RPC port already taken by another process.
  2. Repeat with the inspect port taken.
  3. Repeat with an invalid claimer key.
- **Expected:** the node exits with a non-zero code and the log names the service that failed and why (service, port or setting). No half-started node is left serving.
- **Notes:**
  - The node services in `compose.yaml` have no restart policy, so after a fatal exit the container stays stopped until an operator or external orchestration restarts it. Record that as part of the result.

## SVC-006 — Graceful shutdown under load: clean exit code and clean resume

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** alpha.13 rebuilt shutdown around context cancellation (#785) and fixed failure exit codes during shutdown, including a shutdown in the middle of a database write (#799). Orchestrators act on the exit code.
- **Steps:**
  1. While inputs are being advanced, send `SIGTERM` to the single-process node.
  2. Repeat with `SIGINT`.
  3. Restart the node.
- **Expected:** exit code 0 for a clean shutdown; non-zero only when a service really failed, with every service error in the log, not only the first. The restart resumes without duplicated or missing inputs.
- **Notes:**
  - The node services in `compose.yaml` have no restart policy, so after a fatal exit the container stays stopped until an operator or external orchestration restarts it. Record that as part of the result.

## SVC-007 — Liveness and readiness endpoints match what orchestrators need

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** `/livez` is now owned by the supervisor (#785) and readiness has a staleness budget (`CARTESI_EVM_READER_READY_MAX_STALENESS`, default 600 s, measured from the last completed scan). The image `HEALTHCHECK` is fixed to `:10000/readyz`; `compose.individual-services.yaml` overrides it with ports 10001 to 10006.
- **Steps:**
  1. Query `/livez` and `/readyz` on the standalone node while it starts, serves and shuts down.
  2. Stop the RPC provider and time how long `/readyz` takes to report not ready, with the default and with a short explicit staleness.
  3. Run split services from `compose.individual-services.yaml` and check every container's health status; then run one image with a non-default telemetry port and no probe override.
- **Expected:** `/livez` is true only while serving and not stopping. `/readyz` returns 200 when every service is ready, otherwise 503 with the sorted names of the unready services, and turns not ready once the configured staleness passes. Split-service containers report healthy with the compose overrides; the custom-port container stays unhealthy until its probe is configured (record it for the operator docs).
- **Notes:**
  - Validator, claimer, JSON-RPC and inspect always report ready; readiness does not certify that claims or requests are succeeding.

## SVC-008 — One failed application does not make the node not ready

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** fixed in alpha.13 (#799, "avoid that application failures degrade readiness"). Readiness gates traffic and restarts, so it deserves a standing check with real applications.
- **Steps:**
  1. Run two applications and drive one into a terminal or FAILED state (see `terminal-states.md`).
  2. Query `/readyz` and keep sending inputs to the healthy application.
- **Expected:** `/readyz` stays ready and the healthy application keeps processing.


## SVC-009 — Node and CLI accept provider responses with `"error": null`

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** go-ethereum 1.17.5+ rejects a successful provider response that contains `"error": null`; alpha.13 strips it in the node and the CLI (#800). Some third-party providers send it; anvil does not.
- **Steps:**
  1. Put a proxy in front of the RPC that adds `"error": null` to every successful response, single and batch.
  2. Run the node through an epoch and use the CLI to send an input and execute an output.
- **Expected:** everything works as without the proxy. Real error objects from the provider are still reported as errors.

## SVC-010 — Database lost during an advance result write stops the node by design

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** alpha.13 calls `supervisor.Fatal` when the machine advanced but the result write is not confirmed, instead of retrying against the advanced machine. CI does not cut the database at that moment.
- **Steps:**
  1. While the advancer is processing inputs, stop the database (or drop its connections) during a result write.
  2. Restart the database and then the node.
- **Expected:** the node exits with a non-zero code and a log line naming the unconfirmed write. After restart it rebuilds the machine from durable state and the input is processed exactly once.

---

<!-- Add entries for specific service failure modes as discovered. -->
