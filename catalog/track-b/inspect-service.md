# Inspect Service

Tests for the inspect HTTP API: boundary payloads, concurrency, addressing modes.

---

## INS-001 — POST /inspect with payload at 2MB boundary

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** boundary behavior.
- **Steps:**
  1. POST an inspect with an exactly-or close to-2MB payload.
- **Expected:** accepted and processed.

## INS-002 — POST /inspect exceeding 2MB

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** error path behavior under HTTP; boundary test.
- **Steps:**
  1. POST an inspect with a payload over 2MB.
- **Expected:** clear rejection at the HTTP level. Document the actual response code and body. (See `../regression-watch.md` RW-002 for the specific prior-cycle question about 200 vs 413.)

## INS-003 — Concurrent inspects up to limit

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** concurrency under real HTTP conditions.
- **Steps:**
  1. Send N concurrent inspect requests where N matches the configured concurrency limit.
- **Expected:** all handled correctly. No dropped responses, no crashes.

## INS-004 — Inspect while an advance is processing: served in parallel and immediately from the last committed state (no partial state, advance not delayed); it only waits while a snapshot is written or the runtime is swapped

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** concurrency and timing between two live code paths (advance on a forked machine, inspect on the committed machine); CI does not run long advances with interleaved inspect traffic.
- **Steps:**
  1. Use an application whose advance takes several seconds (for example an input that emits tens of thousands of reports) and set its snapshot policy so a snapshot is written after the input: `cartesi-rollups-cli app execution-parameters set $APP snapshot_policy EVERY_INPUT`.
  2. Note the application's `processed_input_count` from an inspect, then send the heavy input.
  3. While the advance runs, POST `/inspect/<app>` every 0.2 s (inspect endpoint, default `http://localhost:10012/inspect/<app>`), recording request time, response time and `processed_input_count`; continue through the snapshot write and for a few seconds after.
  4. From the advancer log, take the advance duration ("Processing input" to "Processing input finished") and the snapshot window ("Creating snapshot" until the snapshot is stored). Repeat the advance once without inspect traffic and compare durations.
- **Expected:** during the advance every inspect is answered immediately (no waiting for the advance) with the state of the last committed input: `processed_input_count` is the pre-advance value, never a partial result. When the advance commits, later inspects see the new count. Inspects that arrive while the snapshot is being written (or while the machine runtime is swapped) wait and are answered after it with the post-advance state. The advance takes about the same time with and without inspect traffic. Logs show no errors.

## INS-005 — Inspect by 0x address vs app name

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** parity between addressing modes.
- **Steps:**
  1. Send the same inspect payload once using the app name, once using the 0x address.
- **Expected:** identical responses.

## INS-006 — Inspect for unknown application

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** error path UX.
- **Steps:**
  1. POST inspect to an app name/address that isn't registered.
- **Expected:** 404 or a clear application-not-found error.


## INS-007 — Inspect on a terminal application returns 503

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** alpha.13 answers inspect for terminal applications with HTTP 503 and plain text (#795); clients that expect the Inspect JSON shape will break.
- **Steps:**
  1. Inspect an application in each terminal state you can reach (see `track-b/terminal-states.md`), and one marked DIVERGED or CORRUPTED.
  2. Inspect an application in FAILED state.
- **Expected:** terminal and DIVERGED/CORRUPTED: HTTP 503 with the plain text `Application is terminal; inspect unavailable`. FAILED is recoverable, not terminal: record what it returns.

## INS-008 — Inspect response: raw exception_data plus a sanitized error field; Failed status for cycle and time limits

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** clients parse this response shape: raw guest bytes in `exception_data`, an optional sanitized `error`, and `Failed` for cycle and time limits. CI's inspect tests cover the accepted path.
- **Steps:**
  1. Inspect with a payload that makes the guest raise an exception in the temporary inspect machine.
  2. Inspect with a payload that exceeds the inspect cycle or time limit.
- **Expected:** (1) `exception_data` holds the raw guest bytes and `error` a short sanitized text; the application itself is not marked terminal (inspect runs on a temporary machine). (2) status `Failed` with the sanitized `error`; any reports returned can be a partial prefix.

---

<!-- GET variant, inspect-triggered internal errors, etc. -->
