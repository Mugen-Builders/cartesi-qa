# CLI

Tests for the Cartesi CLI (`cartesi` command): build, run, deposit, send, status, and related commands.

> **Note:** Many basic CLI tests (pure happy-path command execution) are likely covered by CI. This file keeps only the tests that justify manual execution — UX, error message quality, cross-environment behavior.

---

## CLI-001 — `cartesi doctor` with Docker stopped

- **Track:** B
- **Risk:** M
- **Why-not-CI:** error message clarity is a UX concern; CI usually runs with Docker up.
- **Steps:**
  1. Stop Docker Desktop / daemon.
  2. Run `cartesi doctor`.
- **Expected:** exits non-zero with a human-readable message identifying Docker as the missing requirement. Not a stack trace.

## CLI-002 — `cartesi build` with missing dependencies

- **Track:** B
- **Risk:** M
- **Why-not-CI:** CI environments come pre-provisioned; users don't. Error should point at the missing thing clearly.
- **Steps:**
  1. In a valid project, delete `node_modules` (or equivalent for the template).
  2. Run `cartesi build`.
- **Expected:** fails with an error message that identifies the missing dependency and suggests a remediation.

## CLI-003 — Version mismatch (CLI vs Node)

- **Track:** B
- **Risk:** H
- **Why-not-CI:** version compatibility bugs show up across releases in the wild.
- **Steps:**
  1. Install a CLI version incompatible with the installed node/emulator.
  2. Run `cartesi build` or `cartesi run`.
- **Expected:** clear incompatibility message naming both versions. Not a crash or silent wrong behavior.

## CLI-004 — `cartesi create --branch` with invalid branch

- **Track:** B
- **Risk:** L
- **Why-not-CI:** network-dependent error path, UX-sensitive.
- **Steps:**
  1. Run `cartesi create myapp --branch nonexistent-branch-xyz`.
- **Expected:** clear message that the branch was not found. Not a generic git error.

## CLI-005 — Smoke: `cartesi create` → `build` → `run`

- **Track:** A
- **Risk:** H
- **Why-not-CI:** this is the headline user experience; even if CI covers it, we want a human to confirm the flow feels right each release.
- **Steps:**
  1. `cartesi create smoketest`
  2. `cd smoketest && cartesi build`
  3. `cartesi run`
- **Expected:** each step completes without error. `cartesi run` boots a local node reachable on default ports.

---

<!-- Add more entries as the team identifies manual-worthy CLI tests.
     Remember the filter: if CI covers it, don't add it here. -->
