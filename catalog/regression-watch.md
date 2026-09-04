# Regression Watch

Known issues and specific behavior questions from prior cycles that need one re-check next cycle. This list **always changes**:
- Remove an entry when the issue is confirmed fixed (or closed upstream).
- If the same issue recurs in a later cycle, add a note but do not promote to a permanent catalog entry unless it becomes a recurring pattern.
- Do not add permanent boundary tests here — those belong in the component files under `track-b/`.

---

<!-- v2-alpha12's list (old RW-001..007: jsonrpc-api shutdown log, POST /inspect >2MB 413,
     CARTESI_BLOCKCHAIN_ID error format, advancer polling-interval help text, evm-reader ordering
     after dirty restart, advancer recovery after DB restart, evm-reader drift on OP Sepolia) was
     fully cleared — all re-checked in v2-alpha12 and came back Pass. Renumbered from RW-001 for
     what came out of that cycle's testing. -->

## RW-001 — CLI hardcoded a 30M gas limit, breaking transactions on networks with a lower per-tx gas cap

- **Source:** ILC-005, ILC-006, ILC-008, observed in the v2-alpha12 cycle on testnet — transactions failed pre-flight with `exceeds max transaction gas limit` on networks capping per-tx gas below 30M.
- **Upstream issue:** [cartesi/rollups-node#786](https://github.com/cartesi/rollups-node/issues/786) (public, still open)
- **To check:** on a testnet with a per-transaction gas cap below 30M, run `cartesi-rollups-cli execute` and `cartesi-rollups-cli send --hex`. The fix landed in node PR [#787](https://github.com/cartesi/rollups-node/pull/787) (default to estimated gas, with `CARTESI_BLOCKCHAIN_GAS_LIMIT` as an explicit override) but only on `next/2.0` — the upstream issue is still open because that branch hasn't reached a tagged release yet. Confirm it actually resolves the original failure on alpha13, not just that the code changed.
- **Pass condition:** both commands submit successfully with an estimated gas limit; the override env var still works when set. Remove this entry and close the upstream issue.
- **Fail condition:** the same pre-flight rejection still occurs — note the network and update the upstream issue.

## RW-002 — Two or more `addInput` calls in one transaction wedge the app permanently

- **Source:** INP-006, observed in the v2-alpha12 cycle (spambox/batcher/aggregator-style usage) — multiple inputs from the same transaction collided on `transaction_reference` (= tx hash), violating a DB uniqueness constraint and making the evm-reader roll back and endlessly retry that block.
- **Upstream issue:** reported directly to the node team (no public GitHub issue link on file); tracked internally as fixed 2026-07-10.
- **To check:** submit a transaction that calls `InputBox.addInput` two or more times for the same application (spambox-style). The fix is believed to have landed in node PR [#789](https://github.com/cartesi/rollups-node/pull/789) ("Fix input tx reference" — inputs now identified by transaction hash **+ log index**). Confirm on alpha13 that every input from the transaction is processed, in order, with no rollback/retry loop.
- **Pass condition:** all inputs from the transaction are processed correctly, node stays healthy. Remove this entry.
- **Fail condition:** the app still wedges (rollback/retry loop, or inputs dropped/duplicated) — record the exact failure mode and re-open tracking with the node team.

## RW-003 — `machine-tool prove accounts-drive` rejects account balances the contract and machine ledger both accept

- **Source:** local audit of the v2-alpha12 / v3-alpha6 stack — the accounts-drive proof generator (`cartesi-rollups-machine-tool`) hard-rejects any decoded balance above the signed 64-bit range, even though the on-chain contract and the machine's own ledger both treat the field as a full unsigned 64-bit value. Because the prover scans the whole drive and aborts on the first such record, one affected account blocks the emergency-withdrawal proof for every other account in the same drive.
- **Upstream issue:** not filed (fund-custody impact; routed through Cartesi's private disclosure process rather than a public issue).
- **To check:** this needs re-evaluating against the contracts v3.0.0-alpha.8 account re-encoding (see `track-b/foreclose.md` FOR-022), which widened the USD account balance field from a 64-bit to a 96-bit value — that changes the shape of the mismatch and may not be the same fix. Confirm with the node team whether the tooling-side check was updated to match, independent of the contracts-side widening.
- **Pass condition:** the tool generates a valid proof for every balance the contract and ledger accept, with no drive-wide DoS from a single high-balance account. Remove this entry.
- **Fail condition:** the mismatch (or the drive-wide blocking behavior) persists — record whether the contracts alpha.8+ re-encoding changed the failure boundary, and keep this under private disclosure, not a public issue.

## RW-004 — Execution-parameter (wall-clock) failures should mark the app FAILED, not the current behavior

- **Source:** local audit of the v2-alpha12 stack (2-node Authority + control) — a machine execution failure driven by a wall-clock/execution-parameter limit (as opposed to a deterministic, guest-decided outcome) was not handled the way an operator-recoverable failure should be.
- **Upstream issue:** not filed (acknowledged directly by the node team, who described the intended fix as marking the app `FAILED` so the operator can adjust configuration and resume; deterministic **mcycle** limits are a separate, PRT-track discussion).
- **To check:** trigger a wall-clock/execution-parameter failure (not a guest-decided outcome) and confirm the app transitions to a `FAILED` state an operator can recover from by adjusting config and restarting, rather than the previously observed behavior. The deterministic-outcomes rework in node PR [#794](https://github.com/cartesi/rollups-node/pull/794) is a plausible candidate mechanism (it does add fencing for applications whose persisted records contradict execution) but has not been confirmed to be the same fix described here — verify directly against this specific failure mode rather than assuming the PR covers it.
- **Pass condition:** the app reaches `FAILED` on this failure mode and resumes cleanly after an operator fix. Remove this entry.
- **Fail condition:** the app does not recover as described — record the actual observed state transition and follow up with the node team.

---

## Notes from feedback (not active regressions)

- Multi-app restart processing is batch-based by design (including finite resync work), not strict one-by-one round robin; this should not be tracked as a regression by itself.
- If restart fairness is a concern for long-running inputs, tune batch size smaller (including `1`) and use epoch snapshots to reduce initial sync pressure.

