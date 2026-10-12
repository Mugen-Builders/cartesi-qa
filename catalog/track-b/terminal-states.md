# Terminal States

Applications whose machine reaches a terminal outcome. alpha.13 adds five application
states for this (cartesi/rollups-node#795 and #798): `GUEST_EXCEPTION`, `MACHINE_HALTED`,
`MCYCLE_OVERFLOW`, `UNEXPECTED_YIELD` and `INVALID_OUTPUTS_ROOT`. Once an application is
terminal, the node stops executing its inputs (also after a restart), keeps indexing its
L1 events, and exposes the state and its proof data through JSON-RPC.

> **CI covers:** `TestTerminalMachineStates`, `TestMachineHaltSurvivesRestart`,
> `TestInvalidOutputsRoot*` and `TestExceptionInput(Prt)`, all with purpose-built test
> machines. The tests here use real applications, built from the Cartesi CLI templates
> where possible, to check that an ordinary application failure lands in the state an
> operator would expect, and what the operator actually sees.
>
> **Scope boundary:** recovering a terminal application through foreclosure is FOR-025
> in `track-b/foreclose.md`. Reports emitted before the terminal outcome are OUT-008 in
> `track-b/outputs.md`.

---

## TRM-001 — Unhandled exception in a template application

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** CI triggers exceptions with test machines; real applications fail through their language runtime, which may catch the error and reject the input instead.
- **Steps:**
  1. Build applications from the Python and JavaScript templates that raise an unhandled exception on a specific input.
  2. Send that input, then more inputs.
  3. Read the application status through the CLI and JSON-RPC.
- **Expected:** document the resulting state per template (`GUEST_EXCEPTION`, or a rejected input if the runtime catches the error). When terminal, no later input is executed, the state is visible on both surfaces, and later inputs are still indexed.

## TRM-002 — Guest halts the machine

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** same reason as TRM-001, for a guest that shuts the machine down.
- **Steps:**
  1. Build an application that halts the machine (for example by powering off from the guest) on a specific input.
  2. Send that input and more inputs after it.
  3. Restart the node.
- **Expected:** `MACHINE_HALTED`; no later input is executed, before or after the restart.

## TRM-003 — Unexpected manual yield (the machine yields with a reason other than accept or reject, e.g. the node's unexpected-yield test fixture): UNEXPECTED_YIELD, no later input executed

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** CI asserts the state with this fixture inside the integration harness (`TestTerminalMachineStates`); this runs it on a deployed node and checks what the operator surfaces show, across restarts, next to a healthy application.
- **Steps:**
  1. In a checkout of rollups-node at the tag under test, build the fixture: `make applications/unexpected-yield-dapp` (it runs `go run ./test/tooling/terminalmachine unexpected-yield --output=applications/unexpected-yield-dapp`). The result is a stored machine snapshot of a synthetic 4 KiB-RAM machine that answers its first advance with a manual yield of reason 9, which is neither accepted nor rejected. Optionally, also use a guest program on a real rootfs that issues a manual yield with such a reason.
  2. Deploy it as an Authority application next to a healthy sibling (for example `make applications/echo-dapp`): `cartesi-rollups-cli deploy application t-unexp applications/unexpected-yield-dapp`.
  3. Send one input, then two more. Restart the advancer and send another input; restart the whole node and send another.
  4. After each step read `cartesi-rollups-cli app status t-unexp`, `cartesi-rollups-cli read inputs t-unexp`, `cartesi_getApplication`, `cartesi_listInputs` and the advancer log.
- **Expected:** `UNEXPECTED_YIELD`: the first input completes with that status and the application becomes `UNEXPECTED_YIELD`; no later input is executed, before or after the restarts (they stay unprocessed but are still indexed); the state is the same on every surface, and the sibling application keeps processing.

## TRM-004 — Mcycle overflow

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** same reason as TRM-001. Likely expensive to reach with a real application. CI reaches the limit only with a purpose-built machine; this checks what a deployed node does at the emulator boundary and which configured limits stop the advance first.
- **Steps:**
  1. Read the application's `advance_max_cycles` (`cartesi-rollups-cli app execution-parameters get`) and the advance deadline.
  2. Reach mcycle overflow with a purpose-built machine configuration, recording how it was reached: for example build a machine whose `mcycle` starts close to the emulator limit with `go run ./test/tooling/terminalmachine` in a rollups-node checkout at the tag under test (it sets `mcycle` near `UINT64_MAX` so the next advance crosses it), and deploy it.
  3. Send an input, then more inputs; read the input status, `cartesi-rollups-cli app status`, `cartesi_getApplication` and the advancer log. Restart the node and read them again.
  4. With an ordinary template, try to reach the limit by raising `advance_max_cycles` and the deadline, and record which limit stops the advance.
- **Expected:** `MCYCLE_OVERFLOW` is recorded for the application with the input that caused it, with the same checks as TRM-002 (no later input is executed, before or after the restart). If overflow is not reachable in practice, record that the configured limits (cycle cap, deadline) stop any real advance before the emulator limit, and keep this entry as evidence-checked against CI.
- **Notes:**
  - A configured mcycle target that coincides with the emulator boundary can also produce this completion. A configured limit that aborts the advance before the emulator boundary is TRM-007, not this test.

## TRM-005 — Guest accepts an input but writes a wrong outputs Merkle root to the tx buffer (wrong value or wrong length; the node's invalid-outputs-root fixtures): INVALID_OUTPUTS_ROOT recorded once, no claim, survives restart

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** the commit that adds `INVALID_OUTPUTS_ROOT` (#798, "classify invalid outputs roots as terminal") says "live integration verification remains pending". CI runs the fixtures inside the integration harness; this runs them on a deployed node, with restarts, the chain's claim events and the operator surfaces.
- **Steps:**
  1. In a checkout of rollups-node at the tag under test, build the fixtures: `make invalid-outputs-root-dapps`. This creates `applications/invalid-outputs-root-dapp` (`terminalmachine invalid-outputs-root --kind=value`: accepts the input and leaves a wrong outputs root value in the TX buffer), `applications/invalid-outputs-root-length-dapp` (`--kind=length`: accepts while declaring a root of the wrong length) and `applications/invalid-template-outputs-root-dapp` (`--kind=template`: a template whose outputs root is zero).
  2. Deploy the value and length fixtures as Authority applications and as PRT applications (`cartesi-rollups-cli deploy application <name> <snapshot dir>`), the template fixture once, and a healthy sibling (for example `make applications/echo-dapp`) on the same node.
  3. Send one input to each application, then more inputs; wait for the epoch to close (a wrong value is found by the validator when the epoch closes; a wrong length is found when the input completes).
  4. Restart the advancer, then the whole node, sending an input after each restart.
  5. Read the application status and reason (`cartesi-rollups-cli app status`, `cartesi_getApplication`), the epochs (`cartesi-rollups-cli read epochs`), the advancer and validator logs, and the claim events of each application's consensus on chain (`cast logs`).
- **Expected:** `INVALID_OUTPUTS_ROOT` is recorded once and does not change afterwards; L1 observation continues; no claim with the invalid root is submitted (none in the database or on chain); no later input is executed; the state survives the restarts; the sibling application keeps processing.

## TRM-006 — What an operator sees for a terminal application

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** CI asserts states, not whether an operator can understand them.
- **Steps:**
  1. For every state reached in TRM-001 to TRM-005, read `cartesi-rollups-cli app status`, the application through JSON-RPC, and the node log.
- **Expected:** on every surface the state, the input index and the reason are identifiable; the proof data exposed through JSON-RPC belongs to the terminal input; the log line at the transition says what happened and points to the next step (foreclosure).
- **Notes:**
  - Also check inspect for each state (INS-007): HTTP 503 with plain text.


## TRM-007 — Configured execution limit aborts the advance: input stays NONE, application FAILED

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** this is the recoverable path, distinct from the terminal states: a configured cycle cap, deadline, output or report count, or payload ceiling aborts the live advance. CI checks the mechanism with test machines; this checks the operator recovery loop.
- **Steps:**
  1. Set a tight execution parameter (for example the advance deadline or cycle cap) with `cartesi-rollups-cli app execution-parameters set`, and send an input that exceeds it.
  2. Check the input and application status.
  3. Raise the limit, re-enable the application, and watch the input.
  4. Separately, stop the node with `SIGTERM` in the middle of a long advance.
- **Expected:** (2) no completed result is stored: the input stays `NONE` and the application is FAILED. It does not retry on its own. (3) after the fix and re-enable, the same input is processed normally. (4) shutdown does not mark the application FAILED.
- **Notes:**
  - This is the behavior the node team described for regression-watch RW-004.

---

<!-- Add entries here when a real application reaches a terminal state in a way these
     do not describe. -->
