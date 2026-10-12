# Inputs

Tests for input handling: generic payloads, ETH deposits, ERC20/ERC721/ERC1155 deposits, and custom data fields.

> **Note:** standard deposits of each token type are likely covered by CI. Keep manual entries focused on boundaries, malformed data, and multi-wallet/race scenarios.

---

## INP-001 — Deposit with execLayerData up to the InputBox 64 KiB input cap: accepted byte-exact at the cap, clear InputTooLarge revert above it, no silent truncation

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** the cap applies to the whole encoded input, not to `execLayerData`, so the largest usable value depends on each portal's payload layout; CI does not push portal deposits to that boundary or check the bytes end to end (L1 event, node API, machine).
- **Steps:**
  1. Compute the largest `execLayerData` length N for each portal. The InputBox rejects an input whose encoding (the `EvmAdvance` call: 292 bytes of header plus the portal payload padded to 32 bytes) exceeds 65,536 bytes. With rollups-contracts v3.0.0-alpha.10 this gives N = 65,164 for an Ether deposit (payload = 20 + 32 + N) and N = 65,144 for an ERC-20 deposit (payload = 72 + N).
  2. Use an application that echoes the received `execLayerData` (for example in a notice). Deposit Ether with an N-byte deterministic pattern: `cast send $ETHER_PORTAL 'depositEther(address,bytes)' $APP 0x<N bytes> --value 0.1ether`.
  3. Deposit an ERC-20 the same way (approve the Erc20Portal, then `depositErc20Tokens(address,address,uint256,bytes)` with N bytes).
  4. For each deposit, read the input with `cartesi-rollups-cli read inputs $APP <index> --jsonrpc` and compare the tail of the payload with the bytes sent; compare the notice the application emitted with the bytes sent.
  5. Repeat both deposits with N + 1 bytes and with a far larger value (for example 300,000 bytes).
- **Expected:** at N the deposit is mined, the input is `ACCEPTED`, and the `execLayerData` bytes are identical on L1, in the node API and inside the machine. At N + 1 and above the transaction is rejected with `InputTooLarge(appContract, inputLength, maxInputLength)` naming both lengths; no input is created and no tokens move. No silent truncation; the node stays healthy.

## INP-002 — Malformed / empty payload

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** error-handling UX; node should not crash on garbage input.
- **Steps:**
  1. Send an input with an empty payload.
  2. Send an input with clearly malformed bytes for the relevant encoding.
- **Expected:** input reaches the app, app's error response surfaces cleanly. Node stays healthy.

## INP-003 — Same-block inputs from multiple wallets

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** ordering under real mempool conditions differs from deterministic CI.
- **Steps:**
  1. From two separate wallets, submit inputs in the same block.
- **Expected:** both inputs processed in the on-chain ordering. No duplication, no dropped input.

## INP-004 — ERC-721 deposit with arbitrary base/exec layer data (empty, binary, truncated JSON, large) through the ERC721 portal: input accepted, app response consistent

- **Risk:** L
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** app-logic-dependent; needs human judgment on whether observed behavior is correct.
- **Steps:**
  1. Deploy an application that handles Erc721Portal deposits and reports what it received (for example the `jplgarcia/tester` dapp, which echoes the base and exec layer data in a notice). Its portal address must be the Erc721Portal of the contracts release under test.
  2. Mint four ERC-721 tokens to the depositor and approve the portal for each: `cast send $TOKEN "approve(address,uint256)" $ERC721_PORTAL $ID`.
  3. Deposit each token with different free-form data bytes. The "metadata" here is the `baseLayerData` and `execLayerData` arguments of the portal deposit, chosen by the depositor; nothing is written inside the machine: `cast send $ERC721_PORTAL "depositErc721Token(address,address,uint256,bytes,bytes)" $TOKEN $APP $ID <baseLayerData> <execLayerData>` with:
     a. both empty: `0x` and `0x`;
     b. non-UTF-8 binary: `0xff00fe80c3` and `0x0001`;
     c. truncated JSON text: `$(cast from-utf8 '{"name":"x","image":')` and `0x00000000`;
     d. large: 4,000 bytes of a known pattern and `0xdeadbeef` (stay below the 64 KiB input cap, see INP-001).
  4. For each deposit check `ownerOf(id)` on the token, the input in `cartesi_listInputs` / `cartesi-rollups-cli read inputs $APP` (sender = Erc721Portal; payload = token, depositor, token id, then `abi.encode(baseLayerData, execLayerData)`), and the application's outputs, reports and status.
- **Expected:** every deposit transaction succeeds, the token is owned by the application, and the input is accepted by the contract and read by the node with exactly the bytes sent. The application's response is consistent with its defined handling (document it per case), and the application and node stay healthy.

## INP-005 — Direct InputBox input with massive payload

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** stress-level payload sizing through direct `InputBox.addInput` is expensive and environment-sensitive.
- **Steps:**
  1. Craft a direct InputBox input payload near practical transaction-size limits.
  2. Submit `addInput` on-chain for the target app.
  3. Read the processed input from node APIs.
- **Expected:** L1 accepts the transaction, the node advances the machine, and the app receives the exact payload bytes (no truncation or mutation).

## INP-006 — Multiple inputs in one transaction (spambox-style)

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** multi-input same-tx ingress depends on custom contract behavior and ordering semantics not covered in standard pipelines.
- **Steps:**
  1. Use a custom smart contract that calls `InputBox.addInput` multiple times in a single transaction.
  2. Submit the transaction while node services are running normally.
  3. Verify node processing order and completeness.
- **Expected:** L1 accepts the transaction and the node keeps up, processing every input in on-chain order with no drops/duplication.

## INP-007 — Deposit USDC into application

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** token-specific bridge wiring and live token behavior are integration-level and chain-dependent.
- **Steps:**
  1. Configure USDC token and portal addresses for the target environment.
  2. Deposit USDC to the application via the appropriate portal flow.
  3. Observe node input ingestion and app-level handling.
- **Expected:** L1 accepts the deposit, node feeds the machine, and the machine reports a successful USDC deposit.

## INP-008 — Request USDC withdrawal in application logic

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** depends on app-specific withdrawal request encoding plus live portal/token contract integration.
- **Steps:**
  1. Submit an app input that requests a USDC withdrawal.
  2. Inspect produced outputs for the expected withdrawal voucher.
- **Expected:** L1 accepts the input transaction, node feeds the machine, and the machine reports a successful USDC withdrawal request.

## INP-009 — Inputs identified and filtered by transaction hash + log index

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** the repository now identifies inputs by `(transaction hash, log index)` instead of a simpler key; CI's fixtures don't stress multi-input-per-tx filtering.
- **Steps:**
  1. Use a custom contract to submit two or more inputs for the same application in a single transaction.
  2. List/filter inputs by that transaction hash via JSON-RPC.
- **Expected:** every input from the transaction is returned, each with a distinct log index, correctly ordered. No input is merged, dropped, or duplicated.


## INP-010 — RPC proxy drops one InputAdded log: the sealed-epoch input count check catches it and the node does not advance; an input whose stored record no longer matches the chain marks the app CORRUPTED

- **Risk:** H
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet
- **Why-not-CI:** alpha.13 validates every sealed epoch window against the on-chain input count and reports conflicting input identities instead of retrying forever (#798, "verify sealed epoch windows"). CI's anvil never drops or alters logs.
- **Steps:**
  1. Setup: a devnet with the application under test and a healthy sibling application on the same node. Put a small JSON-RPC proxy in front of the RPC used by the evm-reader only (set `CARTESI_BLOCKCHAIN_HTTP_ENDPOINT` of the evm-reader to the proxy; the other services keep the direct RPC). The proxy forwards every request unchanged, except that it can (a) remove from an `eth_getLogs` response the log whose `transactionHash` matches a configured value, and (b) rewrite the `transactionHash` and `logIndex` of a configured log. It logs every change it makes.
  2. Dropped log: with the proxy in pass-through, send two inputs X and Y in the same open epoch and confirm both are stored. Configure the proxy to drop Y's `InputAdded` log, then advance the chain until that epoch is sealed on-chain (`cast rpc anvil_mine <n>`; for PRT, until the epoch's tournament settles). Watch the evm-reader log, `cartesi-rollups-cli read epochs $APP`, the application status and `/readyz`. Then put the proxy back in pass-through.
  3. Altered stored input, database variant: stop the evm-reader, send two new inputs P and Q, then change a stored input of the same application so that its L1 log identity is P's: `UPDATE input SET transaction_hash = decode('<P tx hash without 0x>', 'hex'), log_index = <P log index> WHERE epoch_application_id = <app id> AND index = <stored input index>;` and start the evm-reader. (A completed input's payload, status and hashes are protected by a database trigger; the transaction hash and log index are not.)
  4. Altered stored input, proxy variant (on a fresh stack): configure the proxy to rewrite the `InputAdded` log of a new input P so that its `transactionHash` and `logIndex` are those of an input the node already stored, then send P.
  5. After steps 3 and 4, read `cartesi-rollups-cli app status $APP`, `cartesi_getApplication`, the evm-reader log, inspect for the application, and the sibling application's progress.
- **Expected:** (2) the node detects the input count mismatch for that epoch window with an error naming the epoch, the expected and the received count; it stores no epoch with the wrong inputs, does not move past that window, and recovers once the proxy stops dropping. (3)–(4) the application is marked CORRUPTED with a clear error naming the conflicting input identity (alpha.13 has no general reorg rollback), not an endless retry; its later inputs are not executed and the sibling application keeps processing. The sling node documents that it does not make this check (`qa-slingnode-catalog` PRV-004); the two results together are the stack comparison.

## INP-011 — Input sent between stage and accept lands in the next epoch

- **Risk:** M
- **Last Scheduled Test:** v2-alpha13
- **Environment:** devnet + testnet
- **Why-not-CI:** with PRT staging (alpha.13, #798) the next epoch's input bound is sampled at acceptance, not at staging. Users who expect their input in the epoch being staged will be surprised; CI does not assert this from a user's point of view.
- **Steps:**
  1. On a PRT application with a non-zero staging period, send an input after the epoch's result is staged and before it is accepted.
  2. Read the input's epoch through JSON-RPC once both epochs settle.
- **Expected:** the input belongs to the next sealed epoch and its outputs are only provable after that epoch is accepted.

---

<!-- Add entries for fee-on-transfer tokens, boundary deposit amounts, and other edge cases
     as the team identifies manual-worthy tests. -->
