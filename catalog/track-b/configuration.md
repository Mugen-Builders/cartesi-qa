# Configuration

Tests for environment variables, startup validation, and feature flags.

> **Note:** this area was one of the highest-yield in the previous cycle (logging levels, missing auth keys, wrong chain IDs). Manual testing here catches error-message quality and partial-failure behavior that CI misses.

---

## CFG-001 — `CARTESI_LOG_LEVEL=debug` propagates across services

- **Risk:** L
- **Last Scheduled Test:** v2-alpha12
- **Environment:** testnet
- **Why-not-CI:** cross-service log verification is visual; humans notice inconsistencies.
- **Steps:**
  1. Start node with `CARTESI_LOG_LEVEL=debug`.
  2. Generate activity (inputs, outputs).
  3. Observe logs across advancer, claimer, evm-reader, validator.
- **Expected:** debug-level messages appear consistently in all services.

## CFG-002 — `CARTESI_LOG_LEVEL=warn` suppresses info messages

- **Risk:** L
- **Last Scheduled Test:** v2-alpha12
- **Environment:** testnet
- **Why-not-CI:** UX concern — startup config logging is nice to have but is an INFO message; confirm what's lost at WARN.
- **Steps:**
  1. Start node with `CARTESI_LOG_LEVEL=warn`.
  2. Observe startup output.
- **Expected:** no info-level messages. Document which startup markers disappear — operators may want these.

## CFG-003 — Missing `CARTESI_AUTH_PRIVATE_KEY`

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** partial-failure behavior — what does the rest of the node do when the claimer can't start?
- **Steps:**
  1. Start node without `CARTESI_AUTH_PRIVATE_KEY`.
  2. Observe which services come up.
  3. Supply the key later and restart the claimer.
- **Expected:** claimer fails fast with a clear message. Other services start normally. Document the recovery path when the key is provided.
- **Notes:**
  - Re-check the expected result on alpha.13 before marking Fail. In the single-process node, a service initialization failure now shuts the whole supervisor down (cartesi/rollups-node#785), so "other services start normally" may only still hold with split services (`compose.individual-services.yaml`). Record which behavior each mode shows and update this entry.
  - PRT has its own signer settings since alpha.13 (`CARTESI_PRT_AUTH_*`); this test is about the claimer's. See CFG-010.

## CFG-004 — Wrong `CARTESI_BLOCKCHAIN_ID`

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** startup validation clarity; CI doesn't test mismatched chain IDs.
- **Steps:**
  1. Start node with a `CARTESI_BLOCKCHAIN_ID` that does not match the connected RPC.
- **Expected:** evm-reader fails at startup with a clearly formatted error naming both chain IDs, including timestamp and log level. (See `../regression-watch.md` RW-003 for the specific prior-cycle finding.)

## CFG-005 — Invalid `CARTESI_DATABASE_CONNECTION`

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** fast-fail behavior and error clarity.
- **Steps:**
  1. Start node with an unreachable or malformed database connection string.
- **Expected:** services fail at startup with a DB connection error naming the host. No hang, no retry loop without a message.

## CFG-006 — Custom `CARTESI_ADVANCER_POLLING_INTERVAL`

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** observable timing behavior in logs; CI doesn't check real timing.
- **Steps:**
  1. Set a non-default polling interval.
  2. Observe advancer logs and measure effective interval.
- **Expected:** configured interval is respected. Also verify: does the effective interval match what `--help` claims? (See `../regression-watch.md` RW-004 for the specific prior-cycle discrepancy.)

## CFG-009 — `CARTESI_AUTH_KIND=private_key` explicit auth path

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** explicit flag validation; confirm the private_key auth path is used for claim signing when set explicitly (vs. implicit default).
- **Steps:**
  1. Start node with `CARTESI_AUTH_KIND=private_key` and a valid `CARTESI_AUTH_PRIVATE_KEY`.
  2. Observe claim submission.
- **Expected:** claimer signs and submits claims normally. No auth errors in logs.


## CFG-010 — Separate PRT signer (`CARTESI_PRT_AUTH_*`)

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** breaking change in alpha.13 (#798): PRT submission needs its own auth settings and never falls back to `CARTESI_AUTH_*`. With claim submission enabled, standalone startup resolves PRT credentials even when only Authority or Quorum applications are registered.
- **Steps:**
  1. Start the standalone node with claim submission enabled, only Authority applications registered, and only the claimer's `CARTESI_AUTH_*` settings (an alpha.12-style config).
  2. Add `CARTESI_PRT_AUTH_KIND` and its key settings for a different account and run a PRT application.
  3. With a mnemonic, leave both account indexes at their defaults; then configure both to the same address.
  4. Restart with claim submission disabled and no PRT auth settings.
- **Expected:** (1) fails at startup with a message naming the missing PRT auth settings, even though no PRT app exists. (2) PRT transactions are signed by the PRT account and claims by the claimer account. (3) defaults derive different addresses (claimer index 0, PRT index 6); the same address is accepted, with no nonce coordination between the two. (4) starts without resolving PRT signers.

## CFG-011 — Claimer key is not the Authority owner

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** alpha.13 diagnoses this case after a submission revert (#798, "detect authority signer mismatch"). It is not a startup check, so the operator only learns about it when a claim fails.
- **Steps:**
  1. Start the claimer with a key that is not the owner of the application's Authority and let it try to submit a claim.
  2. With a working claimer, transfer the Authority's ownership to another account while the node runs.
- **Expected:** (1) after the revert, the claimer reads the owner at the configured and latest blocks, marks the application FAILED and logs the configured signer and the on-chain owner. (2) while the two owner views differ, the diagnosis waits; once they agree, same result as (1). Record how long the node runs before the operator can see the problem.
- **Notes:**
  - The diagnosis does not run at startup. If an earlier startup check is expected, that is a feature request, not a failure of this test.

## CFG-012 — Database URL with `#` or a repeated parameter

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** pgx v5.11 (#800) parses database URLs like libpq, and the node rejects a URL with `#` or a repeated parameter. A password with `#` that worked on alpha.12 stops working on upgrade.
- **Steps:**
  1. Set `CARTESI_DATABASE_CONNECTION` with a password containing an unencoded `#`, then percent-encoded.
  2. Set it with a repeated query parameter.
- **Expected:** the unencoded `#` and the repeated parameter are rejected at startup with a message saying what is wrong and how to fix it; the percent-encoded password works.

## CFG-013 — Mnemonic key derivation is unchanged after the BIP-32 rewrite

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** alpha.13 replaced the BIP-32 library with an internal implementation (#800) and states that derived keys do not change. If they did, the node would sign with an address other than the registered claimer or owner.
- **Steps:**
  1. With one mnemonic, derive the claimer and PRT addresses on alpha.12 and alpha.13 for account indexes 0, 1, 6 and a large valid index.
  2. Set the account index to 2^31.
- **Expected:** (1) identical addresses on both versions for every index. (2) rejected with a clear message.

## CFG-014 — Saved service settings are not silently changed

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** testnet
- **Why-not-CI:** alpha.13 stores and validates chain, observation policy and submission mode (#798, "validate saved service settings") and rejects changes instead of replacing them. Operators changing an env var on an existing deployment hit this.
- **Steps:**
  1. Start the node against a database, then restart it with a different `CARTESI_BLOCKCHAIN_ID`.
  2. Restart it with a different observation or submission setting.
- **Expected:** each change is rejected at startup with a message naming the stored and the requested value; nothing in the database is overwritten.

---

<!-- Add entries for each CARTESI_* env var that has non-trivial behavior.
     This is a deep area; don't rush to cover everything at once. -->
