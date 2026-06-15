# Cartesi QA

Internal working documents for the QA team testing Cartesi's SDK and Rollups Node.

This repo is **not** for bug reports. Bugs go upstream to [cartesi/rollups-node](https://github.com/cartesi/rollups-node) (or the relevant repo). Security issues go through Cartesi's private disclosure process.

This repo is for our team's process: what we test, how we plan cycles, what we find during exploration, and how we report back.

---

## The three tracks

We run manual QA in three tracks, each with a different cadence and purpose.

### Track A — Release Smoke

A tight checklist (~25 tests) covering happy-path basics: install, create, build, run, one of each deposit type, one notice + one voucher end-to-end, one live testnet deploy.

- **When:** every release candidate
- **Who:** one tester; the lead signs off
- **Duration:** 3-4 hours
- **Purpose:** floor check. If Track A fails, the release isn't ready. Stop and triage.

### Track B — Deep Validation

A risk-weighted matrix (~60-80 tests) focused on boundaries, negative cases, cross-environment behavior, and UX. Each test must answer "what could go wrong here that a CI integration test wouldn't catch?"

- **When:** major releases, or when a substantial component changed
- **Who:** whole team, distributed by component
- **Duration:** 1-2 weeks
- **Purpose:** catch what CI can't — partial failures, error message quality, real-testnet behavior, multi-environment differences.

### Track C — Exploratory Charters

Time-boxed 2-hour sessions with a theme, no pre-written test cases. Output is a markdown session note and any bugs filed upstream.

- **When:** during cycles, and opportunistically between them
- **Who:** experienced tester leads; newer testers pair to learn
- **Duration:** 2 hours per session
- **Purpose:** find what we don't know to look for. Charter findings that are specific and reproducible get promoted to catalog entries.

---

## The one filter

Before any test goes in the catalog, it must answer:

> **What could go wrong here that a Go unit test or a GitHub Actions integration test wouldn't catch?**

Valid answers: error message quality, cross-environment behavior, partial-failure recovery, UX issues, multi-component race conditions, real-testnet behavior.

Invalid answer: "nothing really." → drop it, CI has it.

Keep the catalog lean. Our marginal hour is worth more at boundaries than repeating what CI already covers.

---

## The test ratio

Across the whole program, roughly **30% happy-path, 70% breaking/poking.**

- Track A is 100% happy-path (that's its job).
- Track B leans ~70% toward boundary/negative/UX.
- Track C is 100% adversarial.

---

## Where things live

| Artifact | Location |
|---|---|
| Test catalog | `catalog/` in this repo |
| v3 lifecycle reference | `reference/v3-lifecycle.md` |
| v3 QA harness setup | `reference/v3-qa-harness.md` |
| Contracts v3 presentation | `docs/presentations/contracts-v3-pr.html` |
| Charter definitions | `charters/` in this repo |
| Cycle plans & reports | `cycles/` in this repo |
| Session notes (charter outputs) | `cycles/<cycle-name>/session-notes/` |
| Templates | `templates/` in this repo |
| Execution matrix (per cycle) | Google Sheet — [link here] |
| Bug reports | Filed upstream at [cartesi/rollups-node](https://github.com/cartesi/rollups-node/issues) |
| Security issues | Private disclosure per Cartesi's SECURITY policy |

---

## Cycle rhythm

1. **Plan** — lead writes `cycles/<cycle>/plan.md`: what changed, what subset of catalog runs, assignments, timeline. Duplicate relevant catalog rows into a new Cycle tab in the Sheet.
2. **Smoke** — a tester runs Track A. If it fails, pause and triage.
3. **Deep validation** — team runs Track B, distributed by component. Bugs filed upstream, linked from the Sheet.
4. **Exploration** — an experienced tester runs 2-3 Track C charters in parallel.
5. **Report** — lead writes `cycles/<cycle>/report.md`: exec summary, bugs found with severity, what wasn't tested and why, recommendations.
6. **Prune** — after the cycle, update the catalog: remove tests CI now covers, add tests for new bugs, adjust risk levels.

---

## Getting started (new team member)

1. Read this README.
2. Skim `catalog/` to see the shape of known tests.
3. Skim `charters/` to see the shape of exploratory missions.
4. Read the most recent cycle's `plan.md` and `report.md` to see how a real cycle runs.
5. Read `templates/bug-report-template.md` before filing your first upstream bug.
