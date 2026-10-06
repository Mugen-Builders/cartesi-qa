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
- **Why-not-CI:** CI runs PRT on anvil with fast-forwarded time; this is the real join window, block time and finality.
- **Steps:**
  1. Deploy a PRT application on a testnet and send inputs over several epochs.
  2. Watch the node join, stage and settle each epoch.
- **Expected:** every epoch settles with the node's claim inside the join window. Record the time from sealing to settlement.

## PRT-002 — The node recovers its own root bond, also across a restart

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** new in alpha.13 (#798, "recover node-owned root bonds"). CI covers recovery after a restart on anvil; real fees and timing decide whether recovery competes with the next epoch's join.
- **Steps:**
  1. After PRT-001 settles an epoch, watch for the bond recovery.
  2. Repeat with a node restart between settlement and recovery.
  3. Repeat with the PRT account funded just above what the next join needs.
- **Expected:** each bond is recovered once, with no duplicate recovery transaction. With the low balance, the next epoch's join, stage and accept go first (the documented priority) and recovery happens after.

## PRT-003 — The node alone does not defend a disputed epoch

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** documents the alpha.13 posture. CI's passive observer test always has a separate disputer.
- **Steps:**
  1. Run the reference node (PRT) with no sling node.
  2. Have an adversary join with a wrong commitment and let the tournament run.
- **Expected:** the node sends no dispute moves, as documented. Record the outcome (does the adversary win by timeout?), what JSON-RPC and `app status` show, and whether the operator gets any warning. An operator running only the reference node needs to know the application is undefended.

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
  1. Deploy a PRT application and start the node only after epoch 0's join window has closed.
  2. Keep sending inputs over the next epochs.
- **Expected:** record whether the application recovers in later epochs and what the node reports. A silent stall with no message is a finding.

---

<!-- Active dispute responses are out of scope for the reference node in alpha.13. When
     a release adds them, move the dispute checks to the sling catalog's style. -->
