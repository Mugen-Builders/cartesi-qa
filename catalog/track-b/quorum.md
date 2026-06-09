# Quorum Consensus

Tests for Quorum consensus behavior when multiple validators are voting on the same app.

> **Scope boundary:**
> - This file covers one app across multiple validators, including voting, winning-claim staging, and acceptance timing.
> - Multiple applications on one node remain in `track-b/multi-app.md`.
> - PRT-specific paths are out of scope for this cycle.

---

## QUO-001 — Pending quorum votes do not misclassify the app

- **Risk:** H
- **Why-not-CI:** real quorum timing and vote-arrival divergence are hard to model deterministically in CI.
- **Steps:**
  1. Run quorum with peers voting at different times for the same claim window.
  2. Observe node classification while votes are still pending.
  3. Continue until majority staging is reached.
- **Expected:** no false `INOPERABLE` during honest pending divergence. Final classification follows majority outcome.

## QUO-002 — Winning quorum claim stages before acceptance

- **Risk:** H
- **Why-not-CI:** quorum vote resolution and the resulting staged claim are consensus-specific behaviors not covered by CI's happy-path isolation tests.
- **Steps:**
  1. Submit a claim on Quorum and keep the local node's vote pending or outvoted.
  2. Observe the claim remain in voting until the quorum outcome is decided.
  3. Let the winning claim become staged.
  4. Wait for the staging period to elapse.
  5. Observe the claimer send `acceptClaim` for the winning claim.
- **Expected:** the submitted claim does not stage immediately. A winning claim from quorum voting is staged first, then accepted after the staging period. If the local node's claim loses, the node classifies it accordingly without treating the honest divergence as `INOPERABLE`.

---