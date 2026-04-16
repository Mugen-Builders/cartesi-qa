# Execution Matrix — Google Sheet Schema

This document describes how the execution matrix (Google Sheet) is structured. The sheet lives outside this repo — link to it from the top-level README once created.

Suggested name: **Cartesi QA — Master**

## Tabs

### Tab 1: `Catalog`

The durable master list. One row per test that exists in `catalog/*.md`. Run-agnostic — does not track per-cycle status.

| Column | Type | Notes |
|---|---|---|
| ID | text | Stable ID matching the catalog entry (e.g. `CLI-001`) |
| Name | text | Short name matching catalog |
| Component | dropdown | cli, inputs, outputs, egress, configuration, state-persistence, multi-app, inspect-service, services, deployment |
| Track | dropdown | A, B |
| Risk | dropdown | H, M, L |
| Why-not-CI | text | One-line justification |
| Last-Run-Cycle | text | e.g. `2026-04-v2.1-rc1` |
| Last-Run-Result | dropdown | Pass, Pass-with-notes, Fail, Skipped, Not-yet-run |
| Catalog-Link | URL | Link to the specific catalog entry (GitHub permalink) |

### Tab 2: `Cycle: vX.Y[-rcN]` (one per cycle)

Per-cycle execution tracking. Duplicate and rename at the start of each cycle.

| Column | Type | Notes |
|---|---|---|
| ID | text | Matches Catalog ID |
| Name | text | Copied from Catalog (use a formula: `=VLOOKUP(A2, Catalog!A:B, 2, FALSE)`) |
| Track | dropdown | A, B |
| Component | text | Copied from Catalog |
| Risk | dropdown | H, M, L |
| Environment | dropdown | self-hosted, fly.io, base-sepolia, optimism-sepolia, ... |
| Assigned | dropdown | Team member names |
| Status | dropdown | Not-started, In-progress, Blocked, Done |
| Result | dropdown | Pass, Pass-with-notes, Fail, Skipped |
| Date | date | When executed |
| Cycle-Notes | text | Per-run observations |
| Linked-Issue | URL | Upstream GitHub issue if a bug was filed |

### Tab 3: `Charters`

Index of charter sessions run this cycle (or across cycles, depending on preference).

| Column | Type | Notes |
|---|---|---|
| Charter | text | Charter name |
| Date | date | When run |
| Tester(s) | text | Names |
| Cycle | text | Which cycle this belonged to |
| Session-Note-Link | URL | Link to the markdown session note in the QA repo |
| Bugs-Filed | number | Count of bugs that came out of this session |

### Tab 4: `Bugs-Index`

Lightweight index of bugs found this cycle. Not a replacement for the GitHub issue tracker — a quick-glance view for reporting.

| Column | Type | Notes |
|---|---|---|
| Upstream-Link | URL | GitHub issue URL |
| Title | text | Issue title |
| Severity | dropdown | Critical, High, Medium, Low |
| Component | dropdown | Matches Catalog components |
| Found-In-Cycle | text | Which cycle |
| Found-Via | dropdown | Track-A, Track-B, Track-C-charter |
| Status | dropdown | Open, Fixed, Won't-fix |

## Filter views to create

Once the sheet exists, pre-build these filter views on the Cycle tab:

- **My assignments** — filter by Assigned = current user
- **Blocked or Fail** — filter by Status = Blocked OR Result = Fail
- **High risk pending** — filter by Risk = H AND Status ≠ Done
- **By component** — group/filter by Component

## Setup order

1. Create the sheet.
2. Build the `Catalog` tab with all entries from `catalog/*.md` (start with the seeded entries).
3. Create a `Cycle: template` tab with formulas in place. Duplicate per cycle.
4. Add filter views.
5. Link the sheet URL from the top-level README in this repo.
