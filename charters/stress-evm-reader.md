# Charter: Stress the EVM Reader

**Time box:** 2 hours
**Last revised:** (update when you modify this charter)

## Theme

The evm-reader sits between the blockchain and the node. Its failure modes matter: dropped WebSocket connections, slow RPCs, reorgs, wrong chain IDs. Push on them.

## Starting points

- Start with a wrong `CARTESI_BLOCKCHAIN_ID`. Re-verify the error message — previous cycle found it lacked timestamp and log level.
- Point at an RPC endpoint that is slow or flaky. How does the reader behave? Does it retry? Log clearly?
- Kill the WebSocket connection while the reader is subscribed. Does it reconnect? How long does it take?
- Configure `CARTESI_BLOCKCHAIN_WS_MAX_RETRIES=1`. Force a failure. What happens?
- Configure `CARTESI_BLOCKCHAIN_WS_RECONNECT_INTERVAL` to something unusual. Verify the interval is respected.
- On a testnet where reorgs happen (or via Anvil simulation), trigger a reorg while the reader is processing. Does input state rewind correctly?
- Force downtime during foreclosure/emergency flow windows (ClaimStaged, ClaimAccepted, Foreclosure, AccountsDriveMerkleRootProved, Withdrawal), then restart and verify event backfill and cursor convergence.
- Compare chain facts against node DB/API state after recovery. Confirm no duplicated or missing foreclosure/emergency events.
- Let the reader run for a long time. Watch for slow memory growth or log spam.

> **Cycle note:** PRT-specific paths are out of scope for this cycle.

## What to look for

- Reconnect behavior that works but doesn't log clearly
- Timing/interval configs that are documented but not respected (or vice versa)
- Reorg handling — any input ending up duplicated or missed
- Divergence between chain truth and local state after reconnects/backfill
- Error messages without context
- Resource leaks over time

## Output

Session note in `cycles/<current-cycle>/session-notes/stress-evm-reader-YYYY-MM-DD.md`.

## Notes from past sessions

<!-- Add short notes after each session. -->
