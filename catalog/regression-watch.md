# Regression Watch

Known issues and specific behavior questions from prior cycles that need one re-check next cycle. This list **always changes**:
- Remove an entry when the issue is confirmed fixed (or closed upstream).
- If the same issue recurs in a later cycle, add a note but do not promote to a permanent catalog entry unless it becomes a recurring pattern.
- Do not add permanent boundary tests here — those belong in the component files under `track-b/`.

---

<!-- v2-alpha12 cleared this list: RW-001 (jsonrpc-api shutdown log), RW-002 (POST /inspect >2MB
     413), RW-003 (CARTESI_BLOCKCHAIN_ID error format), RW-004 (advancer polling-interval help
     text), RW-005 (evm-reader ordering after dirty restart), RW-006 (advancer recovery after DB
     restart), and RW-007 (evm-reader drift on OP Sepolia) were all re-checked in the v2-alpha12
     cycle and came back Pass — removed per the rule above. Add v2-alpha13 findings below,
     starting again at RW-001. -->

---

## Notes from feedback (not active regressions)

- Multi-app restart processing is batch-based by design (including finite resync work), not strict one-by-one round robin; this should not be tracked as a regression by itself.
- If restart fairness is a concern for long-running inputs, tune batch size smaller (including `1`) and use epoch snapshots to reduce initial sync pressure.

