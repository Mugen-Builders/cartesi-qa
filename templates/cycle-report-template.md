# Cycle Report: vX.Y[-rcN]

**Cycle dates:** YYYY-MM-DD → YYYY-MM-DD
**Lead:** (you)
**Sheet:** [link to the relevant tab in the execution matrix]

---

## Executive summary

2-3 sentences. What was tested, what was found, recommendation: ship / ship with caveats / hold.

## Coverage

| Track | Planned | Executed | Skipped | Notes |
|---|---|---|---|---|
| A — Smoke | 25 | 25 | 0 | |
| B — Deep | 62 | 58 | 4 | 4 skipped due to (reason) |
| C — Charters | 3 | 3 | 0 | |

## Bugs found

| Severity | Count | Upstream links |
|---|---|---|
| Critical | 0 | |
| High | 2 | [#123], [#124] |
| Medium | 5 | [#125], [#126], ... |
| Low | 8 | ... |

### Notable findings

Brief narrative of the most important bugs. What they are, why they matter, links to upstream issues.

Don't duplicate the issue tracker — just the 3-5 findings leadership needs to know about.

## What we didn't test and why

Be explicit. This is the section dev teams and leadership actually use to calibrate risk.

- Area X: planned but skipped because (reason)
- Area Y: out of scope this cycle, flagged for next
- Area Z: blocked by (dependency)

## Regressions and re-confirmations

- Previously found issue #NNN: still present / now fixed / behavior changed — here's what we saw
- ...

## Recommendations

- Ship recommendation: (ship / ship with caveats / hold) and why
- Follow-up actions for the dev team
- Catalog updates (what's being added, removed, demoted, promoted to charter)
- Process observations for the next cycle

## Charter session notes

Link to each session note:

- [break-the-claimer](./session-notes/break-the-claimer-YYYY-MM-DD.md)
- [stress-evm-reader](./session-notes/stress-evm-reader-YYYY-MM-DD.md)
- ...
