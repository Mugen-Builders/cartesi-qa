# PRT Service (reference node)

Tests for the reference node's PRT service: submitting claims to a Dave/PRT consensus
(join, stage, settle), recovering its own root bonds, and observing disputes run by
others. In alpha.13 the node **does not respond to disputes** (cartesi/rollups-node#798:
"It does not add active dispute responses"). Disputes are played by the dave sling node.

> **Scope boundary:** the dispute game and the sling node are covered by
> `Mugen-Builders/qa-slingnode-catalog` (protocol and node sections). This file only
> covers what the reference node does around them.
>
> **CI covers:** `TestEchoPrt*` (lifecycle, staging, sentry settlement),
> `TestEchoPrtAcceptedBondRecoveryAfterRestart`, `TestPrtPassiveDisputeObserver` and the
> `prt_passive_observer_*` tests, `TestForeclosePrt*` and `TestRestartMultiAppPrt`, all on
> anvil with fast-forwarded time.

---

## PRT-001 — Undisputed PRT epochs settle on a public testnet

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** CI runs PRT on anvil with fast-forwarded time; this is the real join window, block time and finality. The supplied pre-release runs (2026-09-30) show the sling node, not the reference node, sending acceptance, so Go-originated stage and accept still lack live evidence.
- **Steps:**
  1. Deploy a PRT application on a testnet and send inputs over several epochs.
  2. Run at least one epoch with only the reference node submitting (no sling node), so it has to join, stage, accept and recover by itself.
  3. Watch which address sends each of join, stage, accept and recover.
- **Expected:** every epoch settles with the node's claim inside the join window. In step 2 the reference node sends all four actions itself. Record the time from sealing to acceptance and the sender of each action.

## PRT-002 — The node recovers its own root bond, also across a restart

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** new in alpha.13 (#798, "recover node-owned root bonds"). CI covers recovery after a restart on anvil; real fees and timing decide whether recovery competes with the next epoch's join.
- **Steps:**
  1. After an epoch settles, watch for the bond recovery.
  2. Repeat with a node restart between settlement and recovery.
  3. Repeat with the PRT account funded just above what the next join needs.
  4. Have another account call `tryRecoveringBond` for a root the node owns.
  5. Put an application into FAILED and check its settled roots.
- **Expected:** (1, 2) each bond is recovered once, with no duplicate recovery transaction. (3) the next epoch's join, stage and accept go first; recovery happens after. (4) the payment still goes to the node's PRT signer (the first joiner of the winning commitment). (5) the node does not recover bonds for a FAILED or DIVERGED application; record whether an external call still can.

## PRT-003 — The node alone does not defend a disputed epoch

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** documents the alpha.13 posture. CI's passive observer test always has a separate disputer.
- **Steps:**
  1. Run the reference node (PRT) with no sling node.
  2. Have an adversary join with a wrong commitment and play the dispute.
- **Expected:** the node sends no dispute moves, as documented, and the adversary can win, stage and accept an incorrect result. Record what JSON-RPC and `app status` show (DIVERGED once the finished winner differs from the local commitment at the configured block) and whether the operator gets any earlier warning. An operator running only the reference node needs to know the application is undefended.

## PRT-004 — Disputes run by the sling node are visible through JSON-RPC

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** CI's passive observer uses its own disputers; this cross-checks a real sling-driven dispute down to the step proof.
- **Steps:**
  1. Run the reference node, the sling node and an adversary; let the dispute reach the on-chain step proof.
  2. During and after the dispute, read tournaments, matches and dispute windows through JSON-RPC.
  3. Compare with the on-chain events and the sling node's log.
- **Expected:** every tournament, match, advance and window is there, with values matching the chain, and no partial state is visible while a window is being published.

## PRT-005 — Node started after the epoch-0 join window

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** found in the a13-stack cycle (A13-01): a PRT application with no join in epoch 0 was left unusable on a 300-block devnet window. Checked from the protocol side in `qa-slingnode-catalog` ADV-005.
- **Steps:**
  1. Deploy a PRT application and start the node only after epoch 0's join window has closed, with no other participant joining.
  2. Repeat with the sling node joining the same commitment in time and the reference node starting late.
- **Expected:** (1) the join reverts on the closed window and, once latest and configured reads confirm the commitment never joined, the application is marked FAILED (missed join). Record whether later epochs can make progress. (2) no missed-join diagnosis, since a peer joined the same commitment.


## PRT-006 — Default staging period 0 leaves no reaction window

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** the CLI deploys with `--claim-staging-period` 0 by default, so time-based acceptance is possible immediately after staging. CI's sentry fixtures do not cover the period-zero case.
- **Steps:**
  1. Deploy a PRT application with the default staging period.
  2. Settle an epoch and record the blocks between stage and accept.
  3. Deploy another with a non-zero period and repeat.
- **Expected:** (1, 2) acceptance can follow staging immediately (possibly in the same block), so a guardian has no time to react to a wrong winner. (3) acceptance waits until block `B + P`. Record whether the CLI warns about the zero default; recommend a non-zero period in operator docs.

## PRT-007 — All sentries agreeing accelerates acceptance

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** sentry configuration is deployed by the node and read for acceptance; CI's sentry fixture uses two sentries with period 1000.
- **Steps:**
  1. Deploy with a long staging period and two sentries (the sling node can act as one).
  2. Have every sentry report the staged winner's final state hash.
- **Expected:** acceptance becomes possible before the period ends; a separate accept transaction is still needed. With no sentries registered, acceptance waits for the full period.

## PRT-008 — A dissenting sentry does not block acceptance

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** the dissenting-hash case is not in CI's sentry fixture.
- **Steps:**
  1. Deploy with sentries and a staging period.
  2. Have one sentry report a different final state hash, or not report at all.
- **Expected:** no early acceptance, and the result is still accepted after the period expires. The dissent neither vetoes nor replaces the winner and does not foreclose the application. Record whether the node surfaces the disagreement anywhere.

## PRT-009 — Root tournament finishes with no winner

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** irreversible consensus stall: DaveConsensus has no replacement root, and the node only warns. CI does not drive a no-winner root against the node.
- **Steps:**
  1. Create a root where every commitment is eliminated (for example both sides time out).
  2. Watch the node and the application.
  3. Foreclose with the guardian; repeat on a deployment without a usable guardian.
- **Expected:** the node logs a warning and does not mark the application FAILED or DIVERGED; no result can be staged. With a guardian, foreclosure enables fund recovery but does not restart consensus. Without one, record that the application has no way out; the CLI's default deploy has no guardian (A13-01).

## PRT-010 — PRT transaction stuck pending

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** PRT submission tracking is in memory, with no fee replacement and no retry deadline for a known pending transaction; anvil never leaves transactions pending.
- **Steps:**
  1. Get a PRT join or accept transaction stuck in the mempool (low fee during a fee spike).
  2. Watch the node for 100+ blocks; then make the transaction disappear from the mempool.
- **Expected:** while it is known and pending, the node does not replace or retry it (documented). After both transaction and receipt lookups return not found for 64 blocks, tracking is released. Record whether this costs a join window or clock, and whether the log makes the stuck state visible.

## PRT-011 — Reader mode does not broadcast

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** reader mode (claim submission disabled) suppresses PRT broadcasts but keeps reconciliation and diagnosis running; easy to misconfigure on a node meant to submit.
- **Steps:**
  1. Run the node with claim submission disabled next to a sling node that settles epochs.
- **Expected:** the reference node sends no transaction, reconciles staged and accepted results, keeps observing disputes, and can still diagnose divergence.

---

<!-- Active dispute responses are out of scope for the reference node in alpha.13. When
     a release adds them, move the dispute checks to the sling catalog's style. -->
