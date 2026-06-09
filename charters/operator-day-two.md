# Charter: Operator Day-Two

**Time box:** 2 hours (or split across days if simulating time)
**Last revised:** (update when you modify this charter)

## Theme

Simulate what operating a production node feels like after the first day. Most bugs don't show up on day one — they show up on day ten, when the operator has changed config, upgraded, restarted, and handled a real outage.

## Starting points

- Start a node on a testnet, let it run. Come back later, change a config value, restart. Does it resume correctly?
- Perform a rolling restart of services one by one. Does the node stay healthy?
- Simulate an upgrade: stop the node, upgrade the binary/image, start again. State preserved? Schema migrated cleanly?
- Simulate RPC provider failure: swap the RPC URL to a dead endpoint, observe, then swap to a healthy one.
- Run with intentionally bad emergency-withdraw config (wrong guardian, drive layout/index mismatch, wrong output builder). Verify fail-fast behavior and clear operator guidance.
- Simulate rollout mismatch: old contracts/factory addresses or old DB shape with new binary. Confirm startup/operation fails clearly with actionable diagnostics.
- Fill up the database with data, restart. Is startup still fast?
- Leave the node running idle for hours. Memory? CPU? Log volume?
- Use the internal CLI (`cartesi-rollups-cli`) to inspect the DB. Is the UX reasonable for an operator diagnosing a problem?

> **Cycle note:** PRT-specific paths are out of scope for this cycle.

## What to look for

- Startup that's slow after accumulating state
- Config changes that require more than a restart
- Recovery paths that work but aren't documented
- Emergency path config that passes startup but fails later in unsafe ways
- Memory or disk growth that suggests a leak
- Observability gaps — what would an operator wish they could see?

## Output

Session note in `cycles/<current-cycle>/session-notes/operator-day-two-YYYY-MM-DD.md`.

## Notes from past sessions

<!-- Add short notes after each session. -->
