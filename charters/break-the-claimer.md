# Charter: Break the Claimer

**Time box:** 2 hours
**Typical lead:** Experienced tester
**Last revised:** (update when you modify this charter)

## Theme

The claimer is the only service that submits on-chain claims. It's the most sensitive to auth configuration, on-chain state, and being offline. Push on its failure modes.

## Starting points

These are *suggestions*, not a checklist. The session should follow the tester's judgment.

- Start the node without `CARTESI_AUTH_PRIVATE_KEY`. What do the other services do? What do the logs look like? Now supply the key and restart just the claimer — does it catch up cleanly?
- Run with an auth key for the wrong chain. What fails and how?
- While the claimer is mid-claim-submission, kill it. Restart. Does it re-submit? Duplicate? Resume correctly?
- Let the claimer stay offline for 5+ epochs while the rest of the node runs. Bring it back.
- Point the claimer at an RPC that drops connections periodically.
- Misconfigure `CARTESI_AUTH_KIND` — what happens at startup?
- Observe logs across all these scenarios: are error messages clear? Do they have timestamps and log levels? Can an operator tell what to do next?

## What to look for

- Error messages that lack context, timestamp, or log level
- Silent failures — the claimer stops working but nothing in the logs says why
- Inconsistent state between claimer and the rest of the node
- Recovery paths that don't work or aren't documented
- UX issues: if you were an operator, would you know what to do?

## Output

A session note in `cycles/<current-cycle>/session-notes/break-the-claimer-YYYY-MM-DD.md` with:

- What you tried (rough chronological list)
- What you observed (behavior, log excerpts, screenshots if relevant)
- Bugs filed upstream (with links)
- Hunches for follow-up — things that smelled wrong but you didn't fully characterize

## Notes from past sessions

<!-- Add short notes here after each session so future testers don't retrace the same ground:
     - YYYY-MM-DD (tester): observed X; filed upstream issue #NNN
     - YYYY-MM-DD (tester): the Y path seems safe now, deprioritize next time
-->
