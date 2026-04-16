# Cycle Plan: vX.Y[-rcN]

**Cycle dates:** YYYY-MM-DD → YYYY-MM-DD
**Lead:** (you)
**Sheet:** [link to the relevant tab in the execution matrix]

---

## What's being released

Brief description of the release: version, major changes, components touched.

Link to release notes or the PR/issue that triggered this cycle.

## What changed since the last cycle

- Component X: summary of change, link to PR
- Component Y: summary of change, link to PR
- ...

This section drives risk-weighting. Components that changed more get more Track B coverage.

## Scope

### Track A — Release Smoke
- All ~25 smoke tests. No deviations unless noted here.
- **Assigned:** (name)
- **Target:** complete by (date, usually day 1 of cycle)

### Track B — Deep Validation
Pick catalog subsets based on risk:

| Component | Reason to include | Assigned | Target |
|---|---|---|---|
| Configuration | Changed in this release | (tester) | Week 1 |
| Multi-App | Regression risk from prior cycle | (tester) | Week 1 |
| Inputs | Standard coverage | (tester) | Week 1 |
| Outputs | Standard coverage | (tester) | Week 1 |
| ... | | | |

### Track C — Exploratory Charters
Pick 2-3 charters from `charters/`:

- `break-the-claimer` — (tester), scheduled for (date)
- `stress-evm-reader` — (tester) pair, scheduled for (date)
- ...

## Out of scope

Explicitly list areas we're NOT testing this cycle and why:

- Area X — no changes since last cycle, not touching
- Area Y — deferred to next cycle
- ...

This section matters. It tells leadership what isn't covered so no one assumes.

## Environments

- Self-hosted node (local)
- fly.io (platform tester)
- Base Sepolia
- Optimism Sepolia
- (others as needed)

## Risks and open questions

- Known issue X is expected to still fail; don't re-file
- Area Y depends on dev team confirming Z before we can test
- ...
