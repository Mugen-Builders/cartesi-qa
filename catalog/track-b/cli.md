# CLI

Tests for the Cartesi CLI (`cartesi` command): build, run, deposit, send, status, and related commands.

> **Note:** Many basic CLI tests (pure happy-path command execution) are likely covered by CI. This file keeps only the tests that justify manual execution — UX, error message quality, cross-environment behavior.

---

## CLI-001 — `cartesi doctor` with Docker stopped

- **Risk:** M
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet
- **Why-not-CI:** error message clarity is a UX concern; CI usually runs with Docker up.
- **Steps:**
  1. Stop Docker Desktop / daemon.
  2. Run `cartesi doctor`.
- **Expected:** exits non-zero with a human-readable message identifying Docker as the missing requirement. Not a stack trace.

## CLI-002 — `cartesi build` with missing dependencies

- **Risk:** M
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet
- **Why-not-CI:** CI environments come pre-provisioned; users don't. Error should point at the missing thing clearly.
- **Steps:**
  1. In a valid project, delete `node_modules` (or equivalent for the template).
  2. Run `cartesi build`.
- **Expected:** fails with an error message that identifies the missing dependency and suggests a remediation.


## CLI-003 — `cartesi create --branch` with invalid branch

- **Risk:** L
- **Last Scheduled Test:** v2-alpha12
- **Environment:** devnet
- **Why-not-CI:** network-dependent error path, UX-sensitive.
- **Steps:**
  1. Run `cartesi create myapp --branch nonexistent-branch-xyz`.
- **Expected:** clear message that the branch was not found. Not a generic git error.

## CLI-004 — ERC-20 deposit approves and deposits through Erc20Portal on a devnet from rollups-contracts v3.0.0-alpha.10

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** the CLI and rollups-contracts are released separately; whether the CLI's portal address and ABI match a given contracts release is not covered by either repository's CI.
- **Steps:**
  1. Start a devnet whose contracts come from rollups-contracts v3.0.0-alpha.10 and deploy an application on it. Note the Erc20Portal and InputBox addresses of that deployment.
  2. Mint test tokens to a user account and record the user's and the application's token balances and `getNumberOfInputs(app)` on the InputBox.
  3. Run `cartesi deposit erc20 <amount> --token <token> --from <user> --application <app> --rpc-url <devnet rpc>`.
  4. Check the approval (spender = that deployment's Erc20Portal), the deposit transaction (sent to the Erc20Portal), balances, the InputBox input count and the node's input list.
- **Expected:** the CLI approves the Erc20Portal of the alpha.10 deployment and deposits through it: the user's balance drops by the amount, the application's balance grows by the amount, a new input appears in the InputBox and in the node, and the application processes it. The success message corresponds to that mined deposit; no ABI or function-resolution error.

<!-- Add more entries as the team identifies manual-worthy CLI tests.
     Remember the filter: if CI covers it, don't add it here. -->

