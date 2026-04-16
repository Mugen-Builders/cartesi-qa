# Charters

Exploratory test charters — time-boxed missions with a theme, no pre-written steps.

## What is a charter?

A charter is a 2-hour exploratory session with:

- A **theme** ("break the claimer")
- A **mindset** (adversarial, operator-perspective, newcomer-perspective)
- No pre-written test cases
- An output: a markdown session note in `cycles/<cycle>/session-notes/`

Charters live here as reusable definitions. When a cycle runs, the lead picks 2-3 charters from this folder, schedules them, and the resulting session notes go in the cycle folder.

## When to write a new charter

- A whole area feels under-explored
- A recent bug suggests there's more like it nearby
- A new feature shipped and you want to stress it
- An operator reported something weird that's not yet a clear bug

## When NOT to write a charter

- You know the specific thing you want to test — that's a catalog entry, not a charter
- You want to re-run the exact same thing each cycle — catalog entry
- The scope is "test everything in component X" — too broad, narrow it

## Charter index

| Charter | Focus | Typical lead |
|---|---|---|
| `break-the-claimer.md` | Claimer under misconfiguration, partial failure, restart | Experienced tester |
| `stress-evm-reader.md` | WS drops, reorgs, slow RPC, wrong chain IDs | Experienced tester |
| `misuse-the-cli.md` | Commands in wrong order, weird args, confused-user perspective | Any tester |
| `operator-day-two.md` | Simulate a week of operating the node: restarts, config changes, upgrades | Experienced tester + platform |
| `break-multi-app.md` | Starvation, scheduling, consensus edge cases with multiple apps | Experienced tester |

<!-- Add charter files as new areas emerge. Keep each short — the point is not
     to write a test plan, it's to set a starting point and a time box. -->
