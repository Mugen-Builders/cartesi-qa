# Regression Watch

Known issues and specific behavior questions from prior cycles that need one re-check next cycle. This list **always changes**:
- Remove an entry when the issue is confirmed fixed (or closed upstream).
- If the same issue recurs in a later cycle, add a note but do not promote to a permanent catalog entry unless it becomes a recurring pattern.
- Do not add permanent boundary tests here — those belong in the component files under `track-b/`.

---

## RW-001 — jsonrpc-api shutdown log is missing

- **Source:** SVC-002, observed in last cycle during Phase 2 (clean restarts)
- **Upstream issue:** file/link when filed
- **To check:** send a controlled shutdown signal to jsonrpc-api; confirm whether shutdown emits a stop log entry consistent with other services.
- **Pass condition:** explicit shutdown log entry is present. Remove this entry.
- **Fail condition:** service still stops without a shutdown log line — update the upstream issue reference.

## RW-002 — POST /inspect >2MB returns 200 with error body instead of 413

- **Source:** INS-002, observed in last cycle Phase 15 (inspect service)
- **Upstream issue:** file/link when filed
- **To check:** POST an inspect payload over 2MB; confirm whether the response is now a proper 413 or still returns 200 with an error in the body.
- **Pass condition:** clear HTTP-level rejection (413 or equivalent). Remove this entry and update INS-002 expected result accordingly.
- **Fail condition:** still 200-with-error-body — document the response format and update the upstream issue.

## RW-003 — Wrong `CARTESI_BLOCKCHAIN_ID` error message missing timestamp and log level

- **Source:** CFG-004, observed in last cycle Phase 14 (configuration)
- **Upstream issue:** file/link when filed
- **To check:** start node with a mismatched `CARTESI_BLOCKCHAIN_ID`; confirm whether the evm-reader error message now includes timestamp and log level.
- **Pass condition:** error output includes both. Remove this entry and update CFG-004 expected result.
- **Fail condition:** still missing — note which fields are absent and update the upstream issue.

## RW-004 — `CARTESI_ADVANCER_POLLING_INTERVAL` help text default is outdated

- **Source:** CFG-006, observed in last cycle (`--help` reports 7s, node started with 3s on Base Sepolia)
- **Upstream issue:** file/link when filed
- **To check:** start node without setting `CARTESI_ADVANCER_POLLING_INTERVAL`; compare the effective interval in logs against `cartesi-rollups-advancer --help`.
- **Pass condition:** help text matches the runtime default. Remove this entry.
- **Fail condition:** mismatch remains — record both values and update the upstream issue/documentation task.

## RW-005 — evm-reader reads inputs out of order after dirty restart

- **Source:** SVC-002 (9.4), last cycle. Noted as "Seems to read out of order" during dirty restart with inputs being sent.
- **Upstream issue:** file/link when filed
- **To check:** hard-restart evm-reader while inputs are being submitted; verify that all inputs are processed in correct on-chain order afterward.
- **Pass condition:** input ordering is correct after recovery. Remove this entry.
- **Fail condition:** out-of-order processing confirmed — characterize the scope (always? under load?) and update the upstream issue.

## RW-006 — Advancer halts after database restart with active connections

- **Source:** SVC-002 (9.6), last cycle. Dirty restart of database while services had active connections caused advancer to halt.
- **Upstream issue:** file/link when filed
- **To check:** hard-restart the database while advancer has active connections and pending inputs; confirm advancer resumes automatically.
- **Pass condition:** advancer reconnects and resumes without manual intervention. Remove this entry.
- **Fail condition:** advancer still halts — document whether a manual restart is required and update the upstream issue.

## RW-007 — evm-reader drifts behind OP Sepolia head when RPC latency is high

- **Source:** Hosted-node observation (Fly.io OP Sepolia) plus local delayed-RPC reproduction.
- **Upstream issue:** file/link when filed
- **To check:** compare `chain_head - last_input_check_block` over time on hosted nodes. Run same check on OP Sepolia and Base Sepolia.
- **Pass condition:** lag stays bounded and non-growing under steady load (for example, does not keep increasing over consecutive checks). Remove this entry.
- **Fail condition:** lag grows persistently on OP Sepolia while Base remains stable; likely infra-distance effect (OP server far from RPC / high RTT). Record RTT and lag trend, update upstream issue.
- **Operator note:** temporary mitigation is service restart (catch-up), but drift may return if RPC latency remains high.

---

## Notes from feedback (not active regressions)

- Multi-app restart processing is batch-based by design (including finite resync work), not strict one-by-one round robin; this should not be tracked as a regression by itself.
- If restart fairness is a concern for long-running inputs, tune batch size smaller (including `1`) and use epoch snapshots to reduce initial sync pressure.

