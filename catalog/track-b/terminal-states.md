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

## TRM-003 — Unexpected manual yield

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** same reason as TRM-001, for a manual yield with a reason other than accepted or rejected.
- **Steps:**
  1. Build an application that performs a manual yield with an unexpected reason on a specific input.
  2. Send that input and more inputs after it.
- **Expected:** `UNEXPECTED_YIELD`; no later input is executed.

## TRM-004 — Mcycle overflow

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** same reason as TRM-001. Likely expensive to reach with a real application.
- **Steps:**
  1. Reach mcycle overflow with a purpose-built machine configuration, recording how it was reached.
- **Expected:** `MCYCLE_OVERFLOW`, with the same checks as TRM-002. If overflow is not reachable in practice, record that and keep this entry as evidence-checked against CI.

## TRM-005 — Accepted input with an invalid outputs root

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** the commit that adds `INVALID_OUTPUTS_ROOT` (#798, "classify invalid outputs roots as terminal") says "live integration verification remains pending". CI uses native guest fixtures.
- **Steps:**
  1. Build a guest that accepts an input while leaving an outputs root of the wrong length, and another with a wrong value (for example by writing the TX buffer directly).
  2. Run each on an Authority application and on a PRT application.
  3. Restart the node.
- **Expected:** `INVALID_OUTPUTS_ROOT` is recorded once and does not change afterwards; L1 observation continues; no claim with the invalid root is submitted; the state survives the restart.

## TRM-006 — What an operator sees for a terminal application

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** CI asserts states, not whether an operator can understand them.
- **Steps:**
  1. For every state reached in TRM-001 to TRM-005, read `cartesi-rollups-cli app status`, the application through JSON-RPC, and the node log.
- **Expected:** on every surface the state, the input index and the reason are identifiable; the proof data exposed through JSON-RPC belongs to the terminal input; the log line at the transition says what happened and points to the next step (foreclosure).

---

<!-- Add entries here when a real application reaches a terminal state in a way these
     do not describe. -->
