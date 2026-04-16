# Bug Report Template (for filing upstream)

Use this when filing a bug in [cartesi/rollups-node](https://github.com/cartesi/rollups-node/issues) or the relevant upstream repo.

Do not file bugs in this QA repo. Bugs go upstream so the dev team can triage, fix, and link commits.

---

## Title

Short, specific, action-describing. Not "bug in X" — "`cartesi build` fails silently when node_modules is missing".

## Body

### Summary

One sentence: what doesn't work.

### Environment

- Cartesi CLI version: `cartesi --version` output
- Node version / commit SHA
- OS (for client-side bugs)
- Deployment target (self-hosted, fly.io, testnet name)
- Any relevant env vars

### Steps to reproduce

Numbered, minimal. Anyone should be able to paste these and see the same result.

1. `cartesi create foo`
2. `cd foo && rm -rf node_modules`
3. `cartesi build`

### Expected behavior

What should happen.

### Actual behavior

What does happen. Include full error output, log excerpts, screenshots.

```
paste relevant output
```

### Impact / severity

Your take on severity. Dev team may adjust.

- **Critical** — blocks a release, data loss, security issue
- **High** — major feature broken, no workaround
- **Medium** — feature broken, workaround exists, or minor feature fully broken
- **Low** — cosmetic, typo, docs, minor UX

### Additional context

Anything else relevant: related issues, prior discussion, hypotheses about cause (if confident).

---

## Security issues

Do not file security issues as public GitHub issues. Use Cartesi's private disclosure process (see the SECURITY.md in the relevant repo, or contact the security team directly).
