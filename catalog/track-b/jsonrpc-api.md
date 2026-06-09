# JSON-RPC API

Tests for the `cartesi_*` JSON-RPC API surface: pagination edge cases, error code correctness, and malformed request handling.

> **Note:** the standard read methods (cartesi_getApplication, cartesi_listInputs, cartesi_listOutputs, etc.) are exercised implicitly by the integration test lifecycle and do not need separate manual entries. This file focuses on boundary and error-handling behavior that CI does not assert.

---

## JRP-001 — Malformed JSON body returns -32700 PARSE_ERROR

- **Risk:** M
- **Environment:** devnet
- **Environment:** testnet
- **Why-not-CI:** error code conformance to JSON-RPC spec; CI doesn't submit invalid JSON.
- **Steps:**
  1. Send an HTTP POST to the JSON-RPC endpoint with a body that is not valid JSON.
- **Expected:** HTTP 400 with a JSON-RPC error object containing `code: -32700`.

## JRP-002 — Unknown method returns -32601 METHOD_NOT_FOUND

- **Risk:** L
- **Environment:** devnet
- **Environment:** testnet
- **Why-not-CI:** spec conformance.
- **Steps:**
  1. Call a non-existent method name (e.g., `cartesi_doesNotExist`).
- **Expected:** error object with `code: -32601`.

## JRP-003 — Invalid parameter type returns -32602 INVALID_PARAMS

- **Risk:** M
- **Environment:** devnet
- **Environment:** testnet
- **Why-not-CI:** parameter validation UX; operators and SDK authors depend on clear error codes.
- **Steps:**
  1. Call a method that expects a hex address; pass a decimal integer instead.
  2. Call a method that expects a hex string; pass a plain string.
- **Expected:** `-32602` in both cases. Error message names the offending parameter.

## JRP-004 — Error object structure matches JSON-RPC spec

- **Risk:** M
- **Environment:** devnet
- **Environment:** testnet
- **Why-not-CI:** spec conformance; SDK and tooling consumers depend on a stable error shape.
- **Steps:**
  1. Trigger a known error (e.g., fetch a non-existent index).
  2. Inspect the response body.
- **Expected:** error object contains exactly `code` (integer), `message` (string), and optionally `data`. No extra or missing top-level fields.

## JRP-005 — Pagination: limit=0 coercion

- **Risk:** L
- **Environment:** devnet
- **Environment:** testnet
- **Why-not-CI:** boundary; last cycle found the node silently coerces to a default limit rather than rejecting.
- **Steps:**
  1. Call any list method with `limit: 0`.
- **Expected:** document actual behavior — either a clear error or a coerced default. Consistent across all list methods.

## JRP-006 — Pagination: offset beyond total count

- **Risk:** L
- **Environment:** devnet
- **Environment:** testnet
- **Why-not-CI:** boundary.
- **Steps:**
  1. Call a list method with an offset larger than the total number of items.
- **Expected:** empty `data` array, correct `total_count` in pagination metadata. No error.

## JRP-007 — Pagination: negative offset

- **Risk:** L
- **Environment:** devnet
- **Environment:** testnet
- **Why-not-CI:** invalid input; confirm the API rejects it cleanly.
- **Steps:**
  1. Call a list method with a negative offset value.
- **Expected:** `-32602 INVALID_PARAMS`. No crash, no unexpected result set.

## JRP-008 — Out-of-bounds index fetch

- **Risk:** L
- **Environment:** devnet
- **Environment:** testnet
- **Why-not-CI:** error path clarity.
- **Steps:**
  1. Fetch a specific input/output/report by index using an index that does not exist.
- **Expected:** `-32001` (or equivalent not-found code) with a clear message. No 500 or unstructured error.

---

<!-- Add PRT-specific methods (cartesi_listTournaments etc.) when PRT testing comes into scope. -->
