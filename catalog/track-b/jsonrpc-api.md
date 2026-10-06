# JSON-RPC API

Tests for the `cartesi_*` JSON-RPC API surface: pagination edge cases, error code correctness, and malformed request handling.

> **Note:** the standard read methods (cartesi_getApplication, cartesi_listInputs, cartesi_listOutputs, etc.) are exercised implicitly by the integration test lifecycle and do not need separate manual entries. This file focuses on boundary and error-handling behavior that CI does not assert.

---

## JRP-001 — Malformed JSON body returns -32700 PARSE_ERROR

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** error code conformance to JSON-RPC spec; CI doesn't submit invalid JSON.
- **Steps:**
  1. Send an HTTP POST to the JSON-RPC endpoint with a body that is not valid JSON.
  2. Send an empty (or whitespace-only) body.
- **Expected:** (1) a JSON-RPC error object with `code: -32700`. In alpha.13 parse and parameter errors after the body is read come back as HTTP 200 with a JSON-RPC error body. (2) HTTP 400 with the plain text `Empty request body`.
- **Notes:**
  - The v2-alpha12 run found a plain-text `Invalid JSON` with HTTP 400 instead of a JSON-RPC envelope. alpha.13 reworked the response path (cartesi/rollups-node#793); check both the code and the envelope, and record the HTTP status actually returned.

## JRP-002 — Unknown method returns -32601 METHOD_NOT_FOUND

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** spec conformance.
- **Steps:**
  1. Call a non-existent method name (e.g., `cartesi_doesNotExist`).
- **Expected:** error object with `code: -32601`.

## JRP-003 — Invalid parameter type returns -32602 INVALID_PARAMS

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** parameter validation UX; operators and SDK authors depend on clear error codes.
- **Steps:**
  1. Call a method that expects a hex address; pass a decimal integer instead.
  2. Call a method that expects a hex string; pass a plain string.
- **Expected:** `-32602` in both cases. Error message names the offending parameter.

## JRP-004 — Error object structure matches JSON-RPC spec

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** spec conformance; SDK and tooling consumers depend on a stable error shape.
- **Steps:**
  1. Trigger a known error (e.g., fetch a non-existent index).
  2. Inspect the response body.
- **Expected:** error object contains exactly `code` (integer), `message` (string), and optionally `data`. No extra or missing top-level fields.

## JRP-005 — Pagination: limit=0 coercion

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** boundary; last cycle found the node silently coerces to a default limit rather than rejecting.
- **Steps:**
  1. Call any list method with `limit: 0`.
- **Expected:** document actual behavior — either a clear error or a coerced default. Consistent across all list methods.

## JRP-006 — Pagination: offset beyond total count

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** boundary.
- **Steps:**
  1. Call a list method with an offset larger than the total number of items.
- **Expected:** empty `data` array, correct `total_count` in pagination metadata. No error.

## JRP-007 — Pagination: negative offset

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** invalid input; confirm the API rejects it cleanly.
- **Steps:**
  1. Call a list method with a negative offset value.
- **Expected:** `-32602 INVALID_PARAMS`. No crash, no unexpected result set.

## JRP-008 — Out-of-bounds index fetch

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** error path clarity.
- **Steps:**
  1. Fetch a specific input/output/report by index using an index that does not exist.
- **Expected:** `-32001` (or equivalent not-found code) with a clear message. No 500 or unstructured error.

## JRP-009 — Batch request size budget and item limit

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** JSON-RPC 2.0 batching is new in this cycle; boundary and error-code behavior is not exercised by CI.
- **Steps:**
  1. Send a batch request with a single valid call.
  2. Send a batch with more than 100 entries, and an empty batch (`[]`).
  3. Send a batch whose combined results exceed 10 MiB, with a small entry placed after the one that overflows.
- **Expected:** (1) succeeds normally. (2) each rejected as a whole with **one** JSON-RPC object (not an array) with `id: null` and `-32040`. (3) entries from the overflowing one onwards get `-31003`, including the small entry after it; the budget is cumulative for the batch, the same 10 MiB as a single response.

## JRP-010 — `cartesi_getMatchAdvance` rename (breaking)

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** naming-only breaking change; CI fixtures were updated in the same PR and won't catch stale external callers.
- **Steps:**
  1. Call `cartesi_getMatchAdvance` with a valid match reference.
  2. Call the old name, `cartesi_getMatchAdvanced`.
- **Expected:** (1) succeeds and returns the expected result; (2) is not a registered method (`-32601`). Confirm any SDK/client code the team owns was updated to the new name.

## JRP-011 — Node info method reports chain ID, version, default block

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** new read-only method; value correctness needs a human cross-check against the actual deployment.
- **Steps:**
  1. Call the new node-info method.
- **Expected:** response includes the correct chain ID for the connected network, the running node version, and the configured default block tag.

## JRP-012 — Inclusive index ranges and get-epoch-by-virtual-index

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** boundary semantics of the new inclusive range parameters are easy to get off-by-one on.
- **Steps:**
  1. List epochs/inputs/outputs/reports using an inclusive `[start, end]` range that should return exactly N items.
  2. Fetch an epoch by its virtual contiguous index and compare against the same epoch fetched from the regular listing.
- **Expected:** range queries return exactly the items at both inclusive boundaries (no off-by-one). Virtual-index lookup matches the regular listing result for the same epoch.

## JRP-013 — Filter outputs by execution status and multiple selectors; executed/pending counts

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** new filter combination and count endpoints; index-backed correctness under real data volume isn't exercised by CI's small fixtures.
- **Steps:**
  1. Filter outputs by execution status combined with more than one type selector (e.g. voucher + delegate-call-voucher).
  2. Query the count of executed and pending outputs, and compare against a manual count from the filtered listing.
- **Expected:** filtered listing matches only the requested selectors and execution status; reported counts match the manual tally.

## JRP-014 — List epochs with multiple statuses (JSON-RPC and CLI)

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** new multi-status filter parity between the JSON-RPC method and the CLI equivalent.
- **Steps:**
  1. Call `cartesi_listEpochs` requesting more than one status at once (e.g. `CLAIM_STAGED,CLAIM_ACCEPTED`).
  2. Run the equivalent CLI list-epochs command with the same statuses.
- **Expected:** both surfaces return the same set of epochs, matching only the requested statuses.

## JRP-015 — Custom error codes for missing resource and unknown application

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** this PR intentionally diverges from the originally proposed `-32001`/`-32002` codes in favor of `-31001`/`-31002`; worth confirming the shipped behavior matches the documented divergence.
- **Steps:**
  1. Fetch a resource (input/output/report) by an index that does not exist.
  2. Fetch any resource for an application that is not registered.
- **Expected:** (1) returns `-31001`; (2) returns `-31002`. Error messages name the missing resource/application.


## JRP-016 — v3 contract state is exposed consistently with the chain

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** breaking change in alpha.13 (#798, "expose v3 contract state"); the schema changed under existing SDK clients.
- **Steps:**
  1. For an Authority, a Quorum and a PRT application, read application, epoch, input and tournament state through JSON-RPC.
  2. Compare each field with the contracts' on-chain views at the same block (`snapshot.as_of_block` for tournament views).
  3. Check the renamed fields: epoch `tx_buffer_data_block`/`tx_buffer_proof`, `iflags_y_*` and `htif_tohost_*` (replacing `outputs_merkle_root`/`outputs_merkle_proof`); input `transaction_hash` + `log_index` (replacing `transaction_reference`) and `exception_data`; no application `data_availability`; tournament `winner_commitment`, `final_state_hash` and `finished_at_block` inside `snapshot`.
  4. Compare the responses with the OpenRPC document from `rpc.discover`.
- **Expected:** values match the chain, every field has its documented type, 256-bit fields keep full precision, and the new application states (`GUEST_EXCEPTION`, `MACHINE_HALTED`, `MCYCLE_OVERFLOW`, `UNEXPECTED_YIELD`, `INVALID_OUTPUTS_ROOT`) and input statuses (`OVERFLOW`, `UNEXPECTED_YIELD`, `INVALID_OUTPUTS_ROOT`, with the old `*_LIMIT_EXCEEDED` ones gone) are in the schema.

## JRP-017 — List-work budget and request body limit

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** new admission limits in alpha.13 (#793): CI tests the budget arithmetic, not what a client sees at the boundary.
- **Steps:**
  1. Send a batch whose list `limit` values add up to exactly 10,000, then to 10,001.
  2. Send one list call with `limit` above 10,000.
  3. Send a request body just above 1 MiB.
- **Expected:** (1) 10,000 is accepted; 10,001 is rejected before dispatch as one object with `-31004`, even if few rows exist (the budget counts requested limits). (2) the limit is capped or rejected as documented; record which. (3) HTTP 413.


## JRP-018 — `cartesi_listInputs` positional parameters shifted (breaking)

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** alpha.13 inserted `transaction_hash` before `limit` in `cartesi_listInputs`; clients using positional arrays silently send a limit into the hash slot.
- **Steps:**
  1. Call `cartesi_listInputs` with the alpha.12 positional shape `["APP", null, null, 50, 0]`.
  2. Call it with the alpha.13 shape `["APP", null, null, null, 50, 0, false]` and with named parameters.
- **Expected:** (1) rejected as an invalid hash parameter (`-32602`), not silently misread. (2) both return the same inputs. Record the error message, since it is what an SDK maintainer will see.

## JRP-019 — Bond events through `cartesi_listBondEvents` and `cartesi_getBondEvent`

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** new methods in alpha.13 (#798); CI uses anvil fixtures, not a real dispute with partial refunds and a burn.
- **Steps:**
  1. After a disputed PRT epoch settles (see `track-b/prt.md`), list bond events for that epoch and tournament.
  2. Fetch one event by `tx_hash` and `log_index`.
  3. Compare with the tournament's on-chain events, payments and remaining balance.
- **Expected:** partial refunds and the final recovery appear with values matching the chain. A partial refund's nominal value is not proof of payment: check its success flag against actual balance changes. Deposit `RefundIssued` events are not part of these methods.

## JRP-020 — Requests without `id` are answered, not treated as notifications

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** documented deviation from JSON-RPC 2.0 notifications in alpha.13; clients may rely on the standard.
- **Steps:**
  1. Send a single request without an `id`.
  2. Send a batch where some entries have no `id`.
- **Expected:** each gets a response with `id: null`, as documented. Record it so client authors do not assume notification semantics.

---

<!-- PRT dispute visibility through JSON-RPC is PRT-004 in track-b/prt.md. -->
