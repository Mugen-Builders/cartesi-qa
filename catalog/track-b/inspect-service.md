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

## INS-004 — Inspect while advance is processing

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** queueing behavior under interleaved load.
- **Steps:**
  1. Submit inputs that take noticeable processing time.
  2. While those are advancing, send inspect requests.
- **Expected:** inspects queue and return after advance completes. Logs show concurrent-call handling cleanly.

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

## INS-008 — Inspect exception fields and Failed status

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** alpha.13 changed the inspect response: `exception_payload` becomes an optional sanitized error, raw guest bytes move to `exception_data`, and `Failed` replaces `CycleLimitExceeded`/`TimeLimitExceeded`.
- **Steps:**
  1. Inspect with a payload that makes the guest raise an exception in the temporary inspect machine.
  2. Inspect with a payload that exceeds the inspect cycle or time limit.
- **Expected:** (1) `exception_data` holds the raw guest bytes and the application itself is not marked terminal (inspect runs on a temporary machine). (2) status `Failed`; any reports returned can be a partial prefix.

---

<!-- GET variant, inspect-triggered internal errors, etc. -->
