# Quorum Consensus

Tests for Quorum consensus behavior when multiple validators are voting on the same app.

> **Scope boundary:**
> - This file covers one app across multiple validators, including voting, winning-claim staging, and acceptance timing.
> - Multiple applications on one node remain in `track-b/multi-app.md`.
> - Reference-node PRT service paths are in `track-b/prt.md`.

---

## QUO-001 — Pending quorum votes do not mark the app DIVERGED during honest divergence; only a different winning claim does (CLAIM_REJECTED + DIVERGED)

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** real quorum timing and vote-arrival divergence are hard to model deterministically in CI.
- **Steps:**
  1. Run a Quorum application with several validators voting at different times for the same epoch, with at least one validator voting for a different claim than the local node.
  2. While votes are still pending, read the application status and the local epoch (`cartesi-rollups-cli app status $APP`, `cartesi_listEpochs`) and the claimer log.
  3. Continue until a claim is staged by the majority; repeat with the majority on the local node's claim and with the majority on the other claim.
- **Expected:** while votes are pending the application stays `OK` and the local epoch stays `CLAIM_SUBMITTED`; a differing vote from another validator is only logged. When the local claim wins, the epoch is staged and accepted normally. When a different claim wins before the local one is staged, the local epoch becomes `CLAIM_REJECTED` and the application `DIVERGED` with a reason describing the divergence.

## QUO-002 — Winning quorum claim stages before acceptance

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** quorum vote resolution and the resulting staged claim are consensus-specific behaviors not covered by CI's happy-path isolation tests.
- **Steps:**
  1. Submit a claim on Quorum and keep the local node's vote pending or outvoted.
  2. Observe the claim remain in voting until the quorum outcome is decided.
  3. Let the winning claim become staged.
  4. Wait for the staging period to elapse.
  5. Observe the claimer send `acceptClaim` for the winning claim.
- **Expected:** the submitted claim does not stage immediately. A winning claim from quorum voting is staged first, then accepted after the staging period. If the local node's claim loses, the node classifies it accordingly as described in QUO-001 (`CLAIM_REJECTED` and `DIVERGED`), and does not mark the application while votes are still pending.

## QUO-003 — Quorum claim submission requires a valid machine validity proof

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** same security-sensitive machine validity proof requirement as Authority (see `track-b/foreclose.md` FOR-018..021 for the granular per-error-code cases), now also enforced on `Quorum.submitClaim`; this entry checks the gate applies under multi-validator voting, not the proof mechanics themselves.
- **Steps:**
  1. Have a validator submit a Quorum vote with a valid machine validity proof (machine manually yielded, "RX accepted" reason).
  2. Have a validator submit a vote where the machine was not yielded, or was yielded with a different reason, or the Merkle proof is malformed.
- **Expected:** (1) vote is accepted and counted toward quorum. (2) each variant reverts with the matching error and is not counted as a valid vote.

---