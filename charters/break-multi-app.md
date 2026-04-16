# Charter: Break Multi-App

**Time box:** 2 hours
**Typical lead:** Experienced tester
**Last revised:** (update when you modify this charter)

## Theme

Running multiple applications on one node surfaces scheduling and fairness issues that single-app testing never reveals. Prior cycles found real regressions here. Keep pushing.

## Starting points

- Deploy two apps with very different processing costs (one cheap, one expensive). Load both. Does the cheap one get starved?
- Deploy N apps (try 3, 5, 10). How does the node handle growing N?
- Queue many inputs to app A, then send one to app B. Does B wait for all of A?
- Restart the node with many pending inputs across apps. What's the processing order? Is it fair?
- Deploy apps with different consensus modes side by side (when feasible).
- Kill one app's dependencies while the other runs — does the healthy app keep going?
- Observe memory and CPU distribution across apps under load.

## What to look for

- Serialized processing where parallel or round-robin would be fair
- One app's failure cascading to another
- Input ordering across apps that doesn't match expectation
- Observability gaps — can an operator see per-app metrics easily?

## Output

Session note in `cycles/<current-cycle>/session-notes/break-multi-app-YYYY-MM-DD.md`.

## Notes from past sessions

<!-- Notable prior finding: heavy app starved light app on restart, 10.3 in CSV.
     Confirm whether this has been fixed each cycle. -->
