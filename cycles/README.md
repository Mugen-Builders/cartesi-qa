# Cycles

One folder per QA cycle. Each cycle documents what was tested, what was found, and what was recommended.

## Naming

`YYYY-MM-release-vX.Y[-rcN]/`

Examples: `2026-04-v2.1-rc1/`, `2026-05-v2.1-final/`, `2026-07-v2.2-rc1/`.

## Contents of a cycle folder

```
2026-04-v2.1-rc1/
├── plan.md              # Written by lead before cycle starts
├── report.md            # Written by lead after cycle ends
└── session-notes/       # One file per charter session
    ├── break-the-claimer-2026-04-15.md
    ├── stress-evm-reader-2026-04-16.md
    └── misuse-the-cli-2026-04-17.md
```

The execution matrix (Google Sheet) is separate. Link to the relevant tab from `plan.md`.

## Templates

Use `templates/cycle-plan-template.md` and `templates/cycle-report-template.md` as starting points.
