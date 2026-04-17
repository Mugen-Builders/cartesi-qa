# Configuration

Tests for environment variables, startup validation, and feature flags.

> **Note:** this area was one of the highest-yield in the previous cycle (logging levels, missing auth keys, wrong chain IDs). Manual testing here catches error-message quality and partial-failure behavior that CI misses.

---

## CFG-001 — `CARTESI_LOG_LEVEL=debug` propagates across services

- **Risk:** L
- **Why-not-CI:** cross-service log verification is visual; humans notice inconsistencies.
- **Steps:**
  1. Start node with `CARTESI_LOG_LEVEL=debug`.
  2. Generate activity (inputs, outputs).
  3. Observe logs across advancer, claimer, evm-reader, validator.
- **Expected:** debug-level messages appear consistently in all services.

## CFG-002 — `CARTESI_LOG_LEVEL=warn` suppresses info messages

- **Risk:** L
- **Why-not-CI:** UX concern — startup config logging is nice to have but is an INFO message; confirm what's lost at WARN.
- **Steps:**
  1. Start node with `CARTESI_LOG_LEVEL=warn`.
  2. Observe startup output.
- **Expected:** no info-level messages. Document which startup markers disappear — operators may want these.

## CFG-003 — Missing `CARTESI_AUTH_PRIVATE_KEY`

- **Risk:** H
- **Why-not-CI:** partial-failure behavior — what does the rest of the node do when the claimer can't start?
- **Steps:**
  1. Start node without `CARTESI_AUTH_PRIVATE_KEY`.
  2. Observe which services come up.
  3. Supply the key later and restart the claimer.
- **Expected:** claimer fails fast with a clear message. Other services start normally. Document the recovery path when the key is provided.

## CFG-004 — Wrong `CARTESI_BLOCKCHAIN_ID`

- **Risk:** H
- **Why-not-CI:** startup validation clarity; CI doesn't test mismatched chain IDs.
- **Steps:**
  1. Start node with a `CARTESI_BLOCKCHAIN_ID` that does not match the connected RPC.
- **Expected:** evm-reader fails at startup with a clearly formatted error naming both chain IDs, including timestamp and log level. (See `../regression-watch.md` RW-003 for the specific prior-cycle finding.)

## CFG-005 — Invalid `CARTESI_DATABASE_CONNECTION`

- **Risk:** H
- **Why-not-CI:** fast-fail behavior and error clarity.
- **Steps:**
  1. Start node with an unreachable or malformed database connection string.
- **Expected:** services fail at startup with a DB connection error naming the host. No hang, no retry loop without a message.

## CFG-006 — Custom `CARTESI_ADVANCER_POLLING_INTERVAL`

- **Risk:** L
- **Why-not-CI:** observable timing behavior in logs; CI doesn't check real timing.
- **Steps:**
  1. Set a non-default polling interval.
  2. Observe advancer logs and measure effective interval.
- **Expected:** configured interval is respected. Also verify: does the effective interval match what `--help` claims? (See `../regression-watch.md` RW-004 for the specific prior-cycle discrepancy.)

## CFG-007 — `CARTESI_BLOCKCHAIN_WS_MAX_RETRIES` limits WS reconnect attempts

- **Risk:** M
- **Why-not-CI:** real network failure simulation; CI doesn't drop the WS endpoint.
- **Steps:**
  1. Set `CARTESI_BLOCKCHAIN_WS_MAX_RETRIES=1`.
  2. Start the node, then kill the WS endpoint.
- **Expected:** evm-reader retries once, logs a clear failure message after exhausting retries. No panic. Document the log format.

## CFG-008 — `CARTESI_BLOCKCHAIN_WS_RECONNECT_INTERVAL` controls retry delay

- **Risk:** L
- **Why-not-CI:** timing-dependent; CI doesn't simulate WS outages.
- **Steps:**
  1. Set a short `CARTESI_BLOCKCHAIN_WS_RECONNECT_INTERVAL` (e.g., 2s).
  2. Interrupt the WS connection and observe reconnect timing in logs.
- **Expected:** reconnect attempts happen at the configured interval, not the default.

## CFG-009 — `CARTESI_AUTH_KIND=private-key` explicit auth path

- **Risk:** L
- **Why-not-CI:** explicit flag validation; confirm the private-key auth path is used for claim signing when set explicitly (vs. implicit default).
- **Steps:**
  1. Start node with `CARTESI_AUTH_KIND=private-key` and a valid `CARTESI_AUTH_PRIVATE_KEY`.
  2. Observe claim submission.
- **Expected:** claimer signs and submits claims normally. No auth errors in logs.

---

<!-- Add entries for each CARTESI_* env var that has non-trivial behavior.
     This is a deep area; don't rush to cover everything at once. -->
