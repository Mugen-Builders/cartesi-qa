# Inspect Service

Tests for the inspect HTTP API: boundary payloads, concurrency, addressing modes.

---

## INS-002 — POST /inspect with payload at 2MB boundary

- **Risk:** M
- **Why-not-CI:** boundary behavior.
- **Steps:**
  1. POST an inspect with an exactly-2MB payload.
- **Expected:** accepted and processed.

## INS-003 — POST /inspect exceeding 2MB

- **Risk:** M
- **Why-not-CI:** error path behavior under HTTP; boundary test.
- **Steps:**
  1. POST an inspect with a payload over 2MB.
- **Expected:** clear rejection at the HTTP level. Document the actual response code and body. (See `../regression-watch.md` RW-002 for the specific prior-cycle question about 200 vs 413.)

## INS-004 — Concurrent inspects up to limit

- **Risk:** M
- **Why-not-CI:** concurrency under real HTTP conditions.
- **Steps:**
  1. Send N concurrent inspect requests where N matches the configured concurrency limit.
- **Expected:** all handled correctly. No dropped responses, no crashes.

## INS-005 — Inspect while advance is processing

- **Risk:** M
- **Why-not-CI:** queueing behavior under interleaved load.
- **Steps:**
  1. Submit inputs that take noticeable processing time.
  2. While those are advancing, send inspect requests.
- **Expected:** inspects queue and return after advance completes. Logs show concurrent-call handling cleanly.

## INS-006 — Inspect by 0x address vs app name

- **Risk:** L
- **Why-not-CI:** parity between addressing modes.
- **Steps:**
  1. Send the same inspect payload once using the app name, once using the 0x address.
- **Expected:** identical responses.

## INS-007 — Inspect for unknown application

- **Risk:** L
- **Why-not-CI:** error path UX.
- **Steps:**
  1. POST inspect to an app name/address that isn't registered.
- **Expected:** 404 or a clear application-not-found error.

## INS-008 — GET /inspect parity with POST

- **Risk:** L
- **Why-not-CI:** interface parity between the two HTTP methods; CI only exercises POST.
- **Steps:**
  1. Send the same payload via `GET /inspect/{app}?payload=...` and via `POST /inspect/{app}`.
- **Expected:** identical response bodies and status codes.

---

<!-- GET variant, inspect-triggered internal errors, etc. -->
