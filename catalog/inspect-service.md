# Inspect Service

Tests for the inspect HTTP API: boundary payloads, concurrency, addressing modes.

---

## INS-001 — Smoke: POST /inspect with valid payload

- **Track:** A
- **Risk:** H
- **Why-not-CI:** headline flow.
- **Steps:**
  1. POST a valid inspect payload to `/inspect/{app}`.
- **Expected:** 200 with the expected response body.

## INS-002 — POST /inspect with payload at 2MB boundary

- **Track:** B
- **Risk:** M
- **Why-not-CI:** boundary behavior.
- **Steps:**
  1. POST an inspect with an exactly-2MB payload.
- **Expected:** accepted and processed.

## INS-003 — POST /inspect exceeding 2MB

- **Track:** B
- **Risk:** M
- **Why-not-CI:** prior cycle found this returns 200 with an error in the body rather than a 413 — verify current behavior and whether it has been fixed.
- **Steps:**
  1. POST an inspect with a payload over 2MB.
- **Expected:** clear rejection. Document whether it's 413 or 200-with-error-body.

## INS-004 — Concurrent inspects up to limit

- **Track:** B
- **Risk:** M
- **Why-not-CI:** concurrency under real HTTP conditions.
- **Steps:**
  1. Send N concurrent inspect requests where N matches the configured concurrency limit.
- **Expected:** all handled correctly. No dropped responses, no crashes.

## INS-005 — Inspect while advance is processing

- **Track:** B
- **Risk:** M
- **Why-not-CI:** queueing behavior under interleaved load.
- **Steps:**
  1. Submit inputs that take noticeable processing time.
  2. While those are advancing, send inspect requests.
- **Expected:** inspects queue and return after advance completes. Logs show concurrent-call handling cleanly.

## INS-006 — Inspect by 0x address vs app name

- **Track:** B
- **Risk:** L
- **Why-not-CI:** parity between addressing modes.
- **Steps:**
  1. Send the same inspect payload once using the app name, once using the 0x address.
- **Expected:** identical responses.

## INS-007 — Inspect for unknown application

- **Track:** B
- **Risk:** L
- **Why-not-CI:** error path UX.
- **Steps:**
  1. POST inspect to an app name/address that isn't registered.
- **Expected:** 404 or a clear application-not-found error.

---

<!-- GET variant, inspect-triggered internal errors, etc. -->
