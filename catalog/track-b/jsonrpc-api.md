# JSON-RPC API

Tests for the `cartesi_*` JSON-RPC API surface: pagination edge cases, error code correctness, and malformed request handling.

> **Note:** the standard read methods (cartesi_getApplication, cartesi_listInputs, cartesi_listOutputs, etc.) are exercised implicitly by the integration test lifecycle and do not need separate manual entries. This file focuses on boundary and error-handling behavior that CI does not assert.

---

## JRP-001 — Malformed JSON returns -32700 in a JSON-RPC error body (HTTP 200); empty body returns HTTP 400 plain text

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** error code and transport-level conformance; CI doesn't submit invalid JSON or empty bodies over raw HTTP.
- **Steps:**
  1. POST bodies that are not valid JSON to the JSON-RPC endpoint (default `http://localhost:10011/rpc`), with `curl -s -i` to see status line and headers: a truncated object (`{"jsonrpc":"2.0","method":"cartesi_getNodeInfo","id":1`), plain text, a trailing comma, an invalid UTF-8 byte inside an object, and a truncated batch (`[{...},`).
  2. POST an empty body (`-d ''`) and a whitespace-only body.
- **Expected:** (1) HTTP 200, `Content-Type: application/json`, body `{"jsonrpc":"2.0","error":{"code":-32700,"message":"Parse error"},"id":null}`; for the truncated batch a single error object, not an array. (2) HTTP 400 with a plain-text body (`Empty request body`), not a JSON-RPC envelope.

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

## JRP-008 — Fetch a non-existent index -> -31001 not found (unknown application -31002), never HTTP 500

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** error path clarity across every get method, including server-side faults, is not swept by CI.
- **Steps:**
  1. On a registered application with data, fetch by an index that does not exist: `cartesi_getInput`, `cartesi_getOutput`, `cartesi_getReport`, `cartesi_getEpoch`, `cartesi_getEpochByVirtualIndex`, `cartesi_getWithdrawal` (indexes such as `0x9999`, the first free index, and `0xffffffffffffffff`). On a PRT application also `cartesi_getTournament`, `cartesi_getCommitment`, `cartesi_getMatch`, `cartesi_getMatchAdvance`, `cartesi_getBondEvent` with identities that do not exist.
  2. Repeat a few of them with an application name and a well-formed address that are not registered.
  3. Optionally, pause and then stop the database container and repeat one call.
- **Expected:** (1) HTTP 200 with `{"code":-31001,"message":"<Resource> not found"}` naming the kind of resource. (2) `-31002` `Application not found`. (3) still a JSON-RPC error body (timeout or internal error code), never HTTP 500 or an unstructured response.

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

## JRP-010 — cartesi_getMatchAdvance returns match advances that match the on-chain MatchAdvanced events

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** needs a real PRT dispute with match advances on chain; CI's passive-observer fixture does not compare every advance against the chain.
- **Steps:**
  1. On a PRT application, produce a dispute (an honest active defender plus an adversary joining a wrong commitment) so a match records advances.
  2. List the match's advances: `cartesi_listMatchAdvances` with `application`, `epoch_index`, `tournament_address`, `id_hash`.
  3. Fetch each record with `cartesi_getMatchAdvance` (`application`, `epoch_index`, `tournament_address`, `id_hash`, `tx_hash`, `log_index`), by named and positional parameters.
  4. Read the tournament's `MatchAdvanced` logs for that match id with `cast logs` and compare.
  5. Fetch with a wrong `log_index`, a wrong `tx_hash`, a decimal `log_index`, and an unknown application.
- **Expected:** every `cartesi_getMatchAdvance` result equals its list entry; the set of records equals the chain's `MatchAdvanced` events, field by field (`tx_hash`, `block_number`, `log_index`, `other_parent`, `left_node`, `segment_start_position`, `eliminable_at`). Missing identities return `-31001`, malformed parameters `-32602`, an unknown application `-31002`.

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
  1. Call `cartesi_listEpochs` requesting more than one status at once (`"status": ["CLAIM_STAGED","CLAIM_ACCEPTED"]`).
  2. Run the equivalent CLI command with the same statuses, once through the API and once from the database: `cartesi-rollups-cli read epochs $APP --status CLAIM_STAGED --status CLAIM_ACCEPTED [--jsonrpc]`. The CLI takes one `--status` flag per status (repeat the flag); it does not take a comma-separated list.
- **Expected:** all surfaces return the same set of epochs, matching only the requested statuses.

## JRP-015 — Missing resource returns -31001, unknown application returns -31002

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** clients branch on these two codes; the sweep across every application-scoped method, and both forms of unknown application (name and well-formed address), is broader than CI's per-handler tests.
- **Steps:**
  1. Fetch a resource (input/output/report, and the other get methods) by an index that does not exist in a registered application.
  2. Call every application-scoped method (get, list and count methods) for an application that is not registered, by name and by a well-formed address.
  3. Combine both: unknown application and missing index.
- **Expected:** (1) returns `-31001`; (2) returns `-31002`; (3) returns `-31002` (the application is checked first). Error messages name the kind of missing resource or the application.

## JRP-016 — v3 state matches chain and OpenRPC (tx_buffer_*, transaction_hash + log_index, snapshot fields, every status)

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** SDK clients depend on this schema; CI does not compare live responses from every object with the chain and with the OpenRPC document.
- **Steps:**
  1. For an Authority, a Quorum and a PRT application, read application, epoch, input and tournament state through JSON-RPC.
  2. Compare each field with the contracts' on-chain views at the same block (`snapshot.as_of_block` for tournament views).
  3. Check the fields: epoch `tx_buffer_data_block`/`tx_buffer_proof`, `iflags_y_*` and `htif_tohost_*`; input `transaction_hash` + `log_index` and `exception_data`; tournament `winner_commitment`, `final_state_hash` and `finished_at_block` inside `snapshot`.
  4. Compare the responses with the OpenRPC document from `rpc.discover`.
- **Expected:** values match the chain, every field has its documented type, 256-bit fields keep full precision, and every application status (including `GUEST_EXCEPTION`, `MACHINE_HALTED`, `MCYCLE_OVERFLOW`, `UNEXPECTED_YIELD`, `INVALID_OUTPUTS_ROOT`), input status (including `OVERFLOW`, `UNEXPECTED_YIELD`, `INVALID_OUTPUTS_ROOT`) and epoch status the node returns is a documented value in the schema.

## JRP-017 — List-work budget and request body limit

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** new admission limits in alpha.13 (#793): CI tests the budget arithmetic, not what a client sees at the boundary.
- **Steps:**
  1. Send a batch whose list `limit` values add up to exactly 10,000, then to 10,001.
  2. Send one list call with `limit` above 10,000.
  3. Send a request body just above 1 MiB.
- **Expected:** (1) 10,000 is accepted; 10,001 is rejected before dispatch as one object with `-31004`, even if few rows exist (the budget counts requested limits). (2) a single list call is not rejected: its limit is capped at 10,000. (3) HTTP 413.


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
