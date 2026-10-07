/**
 * Cartesi QA — Google Sheets Template Setup
 *
 * HOW TO USE
 * ──────────
 * 1. Create a new Google Sheet.
 * 2. In the menu: Extensions → Apps Script.
 * 3. Paste the entire contents of this file, replacing any existing code.
 * 4. Click Save, then Run → setupQASheet.
 * 5. Approve the permissions prompt.
 *
 * Result: two sheets are created — "Config" and "TEMPLATE".
 *
 * TO START A NEW SPRINT
 * ──────────────────────
 * 1. Right-click the TEMPLATE tab → "Duplicate".
 * 2. Rename the copy (e.g.  v2.1-rc1  or  2025-Q3-sprint).
 * 3. Fill in Owner, Status, and Result for each test.
 *    The Owner dropdown pulls from the Config sheet dynamically.
 *
 * TO ADD / REMOVE TEAM MEMBERS
 * ──────────────────────────────
 * Edit column A on the "Config" sheet.
 * All existing and future sprint tabs pick up the change automatically.
 */

// ─── Test Data ────────────────────────────────────────────────────────────────
// Format: [id, track, area, test name / description, environment]
// Tracks: 'A' | 'B' | 'C' | 'Regression'

const TESTS = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRACK A — Release Smoke  (run every release candidate)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 1 — Devnet Smoke
  ['SMK-001',  'A', 'CLI',               'Smoke (devnet): cartesi create → build → run on a real developer machine', 'devnet'],
  ['SMK-003',  'A', 'Inputs',            'Smoke (devnet): deposits — ETH, ERC20, ERC721, ERC1155', 'devnet'],
  ['SMK-004',  'A', 'Egress',            'Smoke (devnet): notice proof + ETH withdrawal + ERC20 withdrawal', 'devnet'],
  ['SMK-005',  'A', 'Foreclosure',       'Smoke (devnet): emergency withdrawal after foreclosure (single-use enforced)', 'devnet'],
  // Phase 2 — Testnet Deploy
  ['SMK-006',  'A', 'Deployment',        'Smoke: self-hosted deploy to live testnet (services boot, contracts reachable)', 'testnet'],
  // Phase 3 — Testnet Smoke
  ['SMK-002',  'A', 'CLI',               'Smoke (testnet): one representative CLI action against deployed testnet app', 'testnet'],
  ['SMK-003',  'A', 'Inputs',            'Smoke (testnet): deposits — ETH, ERC20, ERC721, ERC1155', 'testnet'],
  ['SMK-004',  'A', 'Egress',            'Smoke (testnet): notice proof + ETH withdrawal + ERC20 withdrawal', 'testnet'],
  ['SMK-005',  'A', 'Foreclosure',       'Smoke (testnet): emergency withdrawal after foreclosure (single-use enforced)', 'testnet'],

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRACK B — Deep Validation  (major releases / significant component changes)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Rows mirror catalog/track-b/*.md: one row per environment in each entry's
  // Environment field. _orderedTestsForSheet() puts every devnet row first,
  // then every testnet row, keeping this array's order within each.

  // ── CLI ───────────────────────────────────────────────────────────────────
  ['CLI-001',  'B', 'CLI',               'cartesi doctor with Docker stopped — error message is human-readable, not a stack trace', 'devnet'],
  ['CLI-002',  'B', 'CLI',               'cartesi build with missing dependencies — error names the missing thing and how to fix it', 'devnet'],
  ['CLI-003',  'B', 'CLI',               'cartesi create --branch with a nonexistent branch — clear "not found" message', 'devnet'],
  ['CLI-004',  'B', 'CLI',               'ERC-20 deposit approves and deposits through Erc20Portal on a devnet from rollups-contracts v3.0.0-alpha.10', 'devnet'],

  // ── Inputs ────────────────────────────────────────────────────────────────
  ['INP-001',  'B', 'Inputs',            'Deposit with execLayerData up to the InputBox 64 KiB input cap: accepted byte-exact at the cap, clear InputTooLarge revert above it, no silent truncation', 'devnet'],
  ['INP-001',  'B', 'Inputs',            'Deposit with execLayerData up to the InputBox 64 KiB input cap: accepted byte-exact at the cap, clear InputTooLarge revert above it, no silent truncation', 'testnet'],
  ['INP-002',  'B', 'Inputs',            'Malformed / empty payload — node stays healthy, error surfaces to app cleanly', 'devnet'],
  ['INP-002',  'B', 'Inputs',            'Malformed / empty payload — node stays healthy, error surfaces to app cleanly', 'testnet'],
  ['INP-003',  'B', 'Inputs',            'Same-block inputs from multiple wallets — both processed in on-chain ordering', 'devnet'],
  ['INP-003',  'B', 'Inputs',            'Same-block inputs from multiple wallets — both processed in on-chain ordering', 'testnet'],
  ['INP-004',  'B', 'Inputs',            'ERC721 deposit with malformed metadata — input accepted, app response consistent', 'devnet'],
  ['INP-004',  'B', 'Inputs',            'ERC721 deposit with malformed metadata — input accepted, app response consistent', 'testnet'],
  ['INP-005',  'B', 'Inputs',            'Direct InputBox massive payload near tx-size practical limit — accepted and processed with exact bytes', 'devnet'],
  ['INP-005',  'B', 'Inputs',            'Direct InputBox massive payload near tx-size practical limit — accepted and processed with exact bytes', 'testnet'],
  ['INP-006',  'B', 'Inputs',            'Multiple addInput calls in one tx (spambox-style) — node keeps up and preserves on-chain order', 'devnet'],
  ['INP-006',  'B', 'Inputs',            'Multiple addInput calls in one tx (spambox-style) — node keeps up and preserves on-chain order', 'testnet'],
  ['INP-007',  'B', 'Inputs',            'USDC deposit into application — L1 accepts, node feeds machine, machine reports successful deposit', 'devnet'],
  ['INP-007',  'B', 'Inputs',            'USDC deposit into application — L1 accepts, node feeds machine, machine reports successful deposit', 'testnet'],
  ['INP-008',  'B', 'Inputs',            'USDC withdrawal request input — L1 accepts, node feeds machine, machine reports successful request', 'devnet'],
  ['INP-008',  'B', 'Inputs',            'USDC withdrawal request input — L1 accepts, node feeds machine, machine reports successful request', 'testnet'],
  ['INP-009',  'B', 'Inputs',            'Inputs from the same transaction are identified by tx hash + log index and correctly filterable via JSON-RPC', 'devnet'],
  ['INP-009',  'B', 'Inputs',            'Inputs from the same transaction are identified by tx hash + log index and correctly filterable via JSON-RPC', 'testnet'],
  ['INP-010',  'B', 'Inputs',            'Dropped InputAdded log caught by the sealed epoch window check; altered stored input marks the app CORRUPTED', 'devnet'],
  ['INP-011',  'B', 'Inputs',            'Input sent between stage and accept lands in the next PRT epoch', 'devnet'],
  ['INP-011',  'B', 'Inputs',            'Input sent between stage and accept lands in the next PRT epoch', 'testnet'],

  // ── Outputs ───────────────────────────────────────────────────────────────
  ['OUT-001',  'B', 'Outputs',           'Emit notice >2MB — HTTP 400, IOCTL error -105, advancer marks input rejected', 'devnet'],
  ['OUT-001',  'B', 'Outputs',           'Emit notice >2MB — HTTP 400, IOCTL error -105, advancer marks input rejected', 'testnet'],
  ['OUT-002',  'B', 'Outputs',           'Emit a notice at the 2 MiB output limit (the limit applies to the ABI-encoded output, so the largest notice payload is 2,097,056 B): accepted and fully retrievable; one byte more is rejected', 'devnet'],
  ['OUT-002',  'B', 'Outputs',           'Emit a notice at the 2 MiB output limit (the limit applies to the ABI-encoded output, so the largest notice payload is 2,097,056 B): accepted and fully retrievable; one byte more is rejected', 'testnet'],
  ['OUT-003',  'B', 'Outputs',           'Voucher with invalid/reverting destination — clean L1 revert, node healthy', 'devnet'],
  ['OUT-003',  'B', 'Outputs',           'Voucher with invalid/reverting destination — clean L1 revert, node healthy', 'testnet'],
  ['OUT-004',  'B', 'Outputs',           'Reports during advance-state and inspect-state — both retrievable via API', 'devnet'],
  ['OUT-004',  'B', 'Outputs',           'Reports during advance-state and inspect-state — both retrievable via API', 'testnet'],
  ['OUT-005',  'B', 'Outputs',           'Arbitrary blob output accepted and retrievable through JSON-RPC with exact bytes', 'devnet'],
  ['OUT-005',  'B', 'Outputs',           'Arbitrary blob output accepted and retrievable through JSON-RPC with exact bytes', 'testnet'],
  ['OUT-006',  'B', 'Outputs',           'Voucher-address output filter uses its DB index (EXPLAIN shows index scan), matches only intended voucher/delegate-call-voucher', 'devnet'],
  ['OUT-006',  'B', 'Outputs',           'Voucher-address output filter uses its DB index (EXPLAIN shows index scan), matches only intended voucher/delegate-call-voucher', 'testnet'],
  ['OUT-007',  'B', 'Outputs',           'Reports from rejected inputs kept and retrievable through JSON-RPC and the CLI', 'devnet'],
  ['OUT-007',  'B', 'Outputs',           'Reports from rejected inputs kept and retrievable through JSON-RPC and the CLI', 'testnet'],
  ['OUT-008',  'B', 'Outputs',           'Reports emitted before a terminal outcome are kept and retrievable', 'devnet'],
  ['OUT-009',  'B', 'Outputs',           'Input with 20k reports or 20k notices persists completely, no crash-loop, not reprocessed on restart', 'devnet'],

  // ── Egress ────────────────────────────────────────────────────────────────
  ['EGR-001',  'B', 'Egress',            'Execute same voucher twice — second attempt reverts with clear reason', 'devnet'],
  ['EGR-001',  'B', 'Egress',            'Execute same voucher twice — second attempt reverts with clear reason', 'testnet'],
  ['EGR-002',  'B', 'Egress',            'Notice validation and voucher execution with block:latest vs block:finalized — document latency difference', 'devnet'],
  ['EGR-002',  'B', 'Egress',            'Notice validation and voucher execution with block:latest vs block:finalized — document latency difference', 'testnet'],
  ['EGR-003',  'B', 'Egress',            'Execute voucher with insufficient L1 gas — clean revert, no inconsistent node state', 'devnet'],
  ['EGR-003',  'B', 'Egress',            'Execute voucher with insufficient L1 gas — clean revert, no inconsistent node state', 'testnet'],
  ['EGR-004',  'B', 'Egress',            'Withdrawal voucher for amount exceeding contract balance — L1 revert, node records failure cleanly', 'devnet'],
  ['EGR-004',  'B', 'Egress',            'Withdrawal voucher for amount exceeding contract balance — L1 revert, node records failure cleanly', 'testnet'],
  ['EGR-005',  'B', 'Egress',            'Validate arbitrary-blob output proof on L1 — proof accepted', 'devnet'],
  ['EGR-005',  'B', 'Egress',            'Validate arbitrary-blob output proof on L1 — proof accepted', 'testnet'],
  ['EGR-006',  'B', 'Egress',            'Execute non-executable outputs (empty, notice, blob) — each rejected with clear error and clean node failure record', 'devnet'],
  ['EGR-006',  'B', 'Egress',            'Execute non-executable outputs (empty, notice, blob) — each rejected with clear error and clean node failure record', 'testnet'],
  ['EGR-007',  'B', 'Egress',            'Validate USDC withdrawal voucher proof in app contract — accepted', 'devnet'],
  ['EGR-007',  'B', 'Egress',            'Validate USDC withdrawal voucher proof in app contract — accepted', 'testnet'],
  ['EGR-008',  'B', 'Egress',            'Execute USDC withdrawal voucher — L1 accepts and node marks output executed', 'devnet'],
  ['EGR-008',  'B', 'Egress',            'Execute USDC withdrawal voucher — L1 accepts and node marks output executed', 'testnet'],
  ['EGR-009',  'B', 'Egress',            'Attempt Ether withdrawal above app-contract balance — clear L1 revert and clean node failure record', 'devnet'],
  ['EGR-009',  'B', 'Egress',            'Attempt Ether withdrawal above app-contract balance — clear L1 revert and clean node failure record', 'testnet'],
  ['EGR-010',  'B', 'Egress',            'Attempt ERC-721 withdrawal for token not owned by app contract — clear L1 revert and clean node failure record', 'devnet'],
  ['EGR-010',  'B', 'Egress',            'Attempt ERC-721 withdrawal for token not owned by app contract — clear L1 revert and clean node failure record', 'testnet'],
  ['EGR-011',  'B', 'Egress',            'Attempt ERC-1155 withdrawal above app-contract balance — clear L1 revert and clean node failure record', 'devnet'],
  ['EGR-011',  'B', 'Egress',            'Attempt ERC-1155 withdrawal above app-contract balance — clear L1 revert and clean node failure record', 'testnet'],

  // ── Configuration ─────────────────────────────────────────────────────────
  ['CFG-001',  'B', 'Configuration',     'CARTESI_LOG_LEVEL=debug — debug messages appear consistently across all services', 'testnet'],
  ['CFG-002',  'B', 'Configuration',     'CARTESI_LOG_LEVEL=warn — info suppressed; document which startup markers disappear', 'testnet'],
  ['CFG-003',  'B', 'Configuration',     'Missing CARTESI_AUTH_PRIVATE_KEY — claimer fails fast with clear message, other services start normally', 'testnet'],
  ['CFG-004',  'B', 'Configuration',     'Wrong CARTESI_BLOCKCHAIN_ID — evm-reader error names both chain IDs with timestamp + log level', 'testnet'],
  ['CFG-005',  'B', 'Configuration',     'Invalid CARTESI_DATABASE_CONNECTION — services fail fast, no hang, host named in error', 'testnet'],
  ['CFG-006',  'B', 'Configuration',     'Custom CARTESI_ADVANCER_POLLING_INTERVAL — effective interval matches config and --help output', 'testnet'],
  ['CFG-009',  'B', 'Configuration',     'CARTESI_AUTH_KIND=private_key set explicitly — claimer signs and submits claims, no auth errors', 'testnet'],
  ['CFG-010',  'B', 'Configuration',     'Separate PRT signer: with submission enabled, startup needs CARTESI_PRT_AUTH_* even with only Authority apps; no fallback', 'devnet'],
  ['CFG-010',  'B', 'Configuration',     'Separate PRT signer: with submission enabled, startup needs CARTESI_PRT_AUTH_* even with only Authority apps; no fallback', 'testnet'],
  ['CFG-011',  'B', 'Configuration',     'Claimer key not the Authority owner: after a submission revert the app is marked FAILED, naming signer and owner', 'testnet'],
  ['CFG-012',  'B', 'Configuration',     'Database URL with an unencoded # or a repeated parameter rejected with a clear message (pgx v5.11)', 'testnet'],
  ['CFG-013',  'B', 'Configuration',     'Mnemonic-derived addresses match the standard derivation (as computed by cast) for every account index; account index 2^31 is rejected', 'devnet'],
  ['CFG-014',  'B', 'Configuration',     'Saved chain/observation/submission settings: a changed value is rejected, not silently applied', 'testnet'],

  // ── Services ──────────────────────────────────────────────────────────────
  ['SVC-001',  'B', 'Services',          'Clean restart of each service individually while node is idle (7 services: advancer, claimer, evm-reader, validator, jsonrpc-api, database, prt)', 'testnet'],
  ['SVC-002',  'B', 'Services',          'Dirty restart of each service under active workload — no data loss, no stuck state', 'testnet'],
  ['SVC-003',  'B', 'Services',          'AWS KMS signer produces a valid signature on an EIP-1559 (dynamic-fee) network', 'testnet'],
  ['SVC-004',  'B', 'Services',          'KMS authentication failure delays claimer startup (bounded by CARTESI_MAX_STARTUP_TIME) instead of crash-looping', 'testnet'],
  ['SVC-005',  'B', 'Services',          'Single-process node: a service that fails to start stops the whole node with an error naming the service', 'devnet'],
  ['SVC-005',  'B', 'Services',          'Single-process node: a service that fails to start stops the whole node with an error naming the service', 'testnet'],
  ['SVC-006',  'B', 'Services',          'SIGTERM/SIGINT under load: exit code 0 on clean shutdown, every service error logged, clean resume', 'devnet'],
  ['SVC-006',  'B', 'Services',          'SIGTERM/SIGINT under load: exit code 0 on clean shutdown, every service error logged, clean resume', 'testnet'],
  ['SVC-007',  'B', 'Services',          '/livez and /readyz semantics (503 lists unready services), 600 s default staleness, split-service healthchecks', 'devnet'],
  ['SVC-007',  'B', 'Services',          '/livez and /readyz semantics (503 lists unready services), 600 s default staleness, split-service healthchecks', 'testnet'],
  ['SVC-008',  'B', 'Services',          'One failed or terminal application does not make the node not ready', 'devnet'],
  ['SVC-008',  'B', 'Services',          'One failed or terminal application does not make the node not ready', 'testnet'],
  ['SVC-009',  'B', 'Services',          'Node and CLI work with a provider that returns "error": null in successful responses', 'devnet'],
  ['SVC-010',  'B', 'Services',          'Database lost during an advance result write: node exits fatally by design; restart processes the input exactly once', 'devnet'],

  // ── State Persistence ─────────────────────────────────────────────────────
  ['SP-001',   'B', 'State Persistence', 'Hard-kill all containers mid-execution — node recovers to consistent state', 'testnet'],
  ['SP-002',   'B', 'State Persistence', 'Per-input snapshots (--save-snapshot=every-input) — snapshot per input, restart from one resumes correctly', 'testnet'],
  ['SP-003',   'B', 'State Persistence', 'Per-epoch snapshots (--save-snapshot=every-epoch) — snapshot per epoch, restart from one resumes correctly', 'testnet'],
  ['SP-004',   'B', 'State Persistence', 'Claimer resync after >5 epochs offline — catches up without error, document catch-up time', 'testnet'],
  ['SP-005',   'B', 'State Persistence', 'L1 chain reorganization (testnet or Anvil simulation) — no duplicated or lost inputs, state consistent with new chain', 'testnet'],
  ['SP-006',   'B', 'State Persistence', 'Startup replay reconciles persisted history against re-execution with no discrepancy', 'devnet'],
  ['SP-006',   'B', 'State Persistence', 'Startup replay reconciles persisted history against re-execution with no discrepancy', 'testnet'],
  ['SP-007',   'B', 'State Persistence', 'Node fences an application whose persisted outcome contradicts real execution; other apps keep processing', 'devnet'],
  ['SP-007',   'B', 'State Persistence', 'Node fences an application whose persisted outcome contradicts real execution; other apps keep processing', 'testnet'],
  ['SP-008',   'B', 'State Persistence', 'Advancer preserves machine-database alignment after a hard crash mid-processing', 'devnet'],
  ['SP-008',   'B', 'State Persistence', 'Advancer preserves machine-database alignment after a hard crash mid-processing', 'testnet'],
  ['SP-009',   'B', 'State Persistence', 'Corrupted or unreadable saved snapshot is skipped; node replays from the template to the same state', 'testnet'],

  // ── Inspect Service ───────────────────────────────────────────────────────
  ['INS-001',  'B', 'Inspect Service',   'POST /inspect with exactly-2MB payload — accepted and processed', 'devnet'],
  ['INS-001',  'B', 'Inspect Service',   'POST /inspect with exactly-2MB payload — accepted and processed', 'testnet'],
  ['INS-002',  'B', 'Inspect Service',   'POST /inspect with >2MB payload — clear rejection; document response code', 'devnet'],
  ['INS-002',  'B', 'Inspect Service',   'POST /inspect with >2MB payload — clear rejection; document response code', 'testnet'],
  ['INS-003',  'B', 'Inspect Service',   'Concurrent inspects up to execution-parameters limit — all handled, no drops or crashes', 'devnet'],
  ['INS-003',  'B', 'Inspect Service',   'Concurrent inspects up to execution-parameters limit — all handled, no drops or crashes', 'testnet'],
  ['INS-004',  'B', 'Inspect Service',   'Inspect while an advance is processing: served in parallel and immediately from the last committed state (no partial state, advance not delayed); it only waits while a snapshot is written or the runtime is swapped', 'devnet'],
  ['INS-004',  'B', 'Inspect Service',   'Inspect while an advance is processing: served in parallel and immediately from the last committed state (no partial state, advance not delayed); it only waits while a snapshot is written or the runtime is swapped', 'testnet'],
  ['INS-005',  'B', 'Inspect Service',   'Inspect by 0x hex address vs app name — identical responses', 'devnet'],
  ['INS-005',  'B', 'Inspect Service',   'Inspect by 0x hex address vs app name — identical responses', 'testnet'],
  ['INS-006',  'B', 'Inspect Service',   'Inspect for unknown application — 404 or clear app-not-found error', 'devnet'],
  ['INS-006',  'B', 'Inspect Service',   'Inspect for unknown application — 404 or clear app-not-found error', 'testnet'],
  ['INS-007',  'B', 'Inspect Service',   'Inspect on a terminal, DIVERGED or CORRUPTED app returns HTTP 503 plain text; record FAILED behavior', 'devnet'],
  ['INS-007',  'B', 'Inspect Service',   'Inspect on a terminal, DIVERGED or CORRUPTED app returns HTTP 503 plain text; record FAILED behavior', 'testnet'],
  ['INS-008',  'B', 'Inspect Service',   'Inspect response: raw exception_data plus a sanitized error field; Failed status for cycle and time limits', 'devnet'],
  ['INS-008',  'B', 'Inspect Service',   'Inspect response: raw exception_data plus a sanitized error field; Failed status for cycle and time limits', 'testnet'],

  // ── JSON-RPC API ──────────────────────────────────────────────────────────
  ['JRP-001',  'B', 'JSON-RPC API',      'Malformed JSON: -32700 in a JSON-RPC error body (HTTP 200 in alpha.13); empty body: HTTP 400 plain text', 'devnet'],
  ['JRP-001',  'B', 'JSON-RPC API',      'Malformed JSON: -32700 in a JSON-RPC error body (HTTP 200 in alpha.13); empty body: HTTP 400 plain text', 'testnet'],
  ['JRP-002',  'B', 'JSON-RPC API',      'Non-existent method → code -32601 METHOD_NOT_FOUND', 'devnet'],
  ['JRP-002',  'B', 'JSON-RPC API',      'Non-existent method → code -32601 METHOD_NOT_FOUND', 'testnet'],
  ['JRP-003',  'B', 'JSON-RPC API',      'Wrong parameter type (decimal where hex expected) → code -32602 INVALID_PARAMS, offending param named', 'devnet'],
  ['JRP-003',  'B', 'JSON-RPC API',      'Wrong parameter type (decimal where hex expected) → code -32602 INVALID_PARAMS, offending param named', 'testnet'],
  ['JRP-004',  'B', 'JSON-RPC API',      'Error object shape matches JSON-RPC spec: exactly {code, message, [data]}, no extra fields', 'devnet'],
  ['JRP-004',  'B', 'JSON-RPC API',      'Error object shape matches JSON-RPC spec: exactly {code, message, [data]}, no extra fields', 'testnet'],
  ['JRP-005',  'B', 'JSON-RPC API',      'Pagination limit=0 — behavior consistent across list methods (document: coerce or reject)', 'devnet'],
  ['JRP-005',  'B', 'JSON-RPC API',      'Pagination limit=0 — behavior consistent across list methods (document: coerce or reject)', 'testnet'],
  ['JRP-006',  'B', 'JSON-RPC API',      'Pagination offset > total count — empty data array, correct total_count, no error', 'devnet'],
  ['JRP-006',  'B', 'JSON-RPC API',      'Pagination offset > total count — empty data array, correct total_count, no error', 'testnet'],
  ['JRP-007',  'B', 'JSON-RPC API',      'Pagination negative offset → -32602 INVALID_PARAMS', 'devnet'],
  ['JRP-007',  'B', 'JSON-RPC API',      'Pagination negative offset → -32602 INVALID_PARAMS', 'testnet'],
  ['JRP-008',  'B', 'JSON-RPC API',      'Fetch a non-existent index -> -31001 not found (unknown application -31002), never HTTP 500', 'devnet'],
  ['JRP-008',  'B', 'JSON-RPC API',      'Fetch a non-existent index -> -31001 not found (unknown application -31002), never HTTP 500', 'testnet'],
  ['JRP-009',  'B', 'JSON-RPC API',      'Batch: >100 or empty rejected as one id:null object with -32040; 10 MiB cumulative budget gives -31003 from the overflowing entry on', 'devnet'],
  ['JRP-009',  'B', 'JSON-RPC API',      'Batch: >100 or empty rejected as one id:null object with -32040; 10 MiB cumulative budget gives -31003 from the overflowing entry on', 'testnet'],
  ['JRP-010',  'B', 'JSON-RPC API',      'cartesi_getMatchAdvance returns match advances that match the on-chain MatchAdvanced events', 'devnet'],
  ['JRP-010',  'B', 'JSON-RPC API',      'cartesi_getMatchAdvance returns match advances that match the on-chain MatchAdvanced events', 'testnet'],
  ['JRP-011',  'B', 'JSON-RPC API',      'New node-info method reports correct chain ID, node version, and default block tag', 'devnet'],
  ['JRP-011',  'B', 'JSON-RPC API',      'New node-info method reports correct chain ID, node version, and default block tag', 'testnet'],
  ['JRP-012',  'B', 'JSON-RPC API',      'Inclusive [start,end] index ranges return exact boundary items; get-epoch-by-virtual-index matches regular listing', 'devnet'],
  ['JRP-012',  'B', 'JSON-RPC API',      'Inclusive [start,end] index ranges return exact boundary items; get-epoch-by-virtual-index matches regular listing', 'testnet'],
  ['JRP-013',  'B', 'JSON-RPC API',      'Filter outputs by execution status + multiple selectors; executed/pending output counts match a manual tally', 'devnet'],
  ['JRP-013',  'B', 'JSON-RPC API',      'Filter outputs by execution status + multiple selectors; executed/pending output counts match a manual tally', 'testnet'],
  ['JRP-014',  'B', 'JSON-RPC API',      'List epochs with multiple statuses at once — JSON-RPC and CLI results match', 'devnet'],
  ['JRP-014',  'B', 'JSON-RPC API',      'List epochs with multiple statuses at once — JSON-RPC and CLI results match', 'testnet'],
  ['JRP-015',  'B', 'JSON-RPC API',      'Missing resource returns -31001, unknown application returns -31002', 'devnet'],
  ['JRP-015',  'B', 'JSON-RPC API',      'Missing resource returns -31001, unknown application returns -31002', 'testnet'],
  ['JRP-016',  'B', 'JSON-RPC API',      'v3 state matches chain and OpenRPC (tx_buffer_*, transaction_hash + log_index, snapshot fields, every status)', 'devnet'],
  ['JRP-016',  'B', 'JSON-RPC API',      'v3 state matches chain and OpenRPC (tx_buffer_*, transaction_hash + log_index, snapshot fields, every status)', 'testnet'],
  ['JRP-017',  'B', 'JSON-RPC API',      'List-work budget: summed limits above 10,000 rejected with -31004; request body above 1 MiB gets HTTP 413', 'devnet'],
  ['JRP-017',  'B', 'JSON-RPC API',      'List-work budget: summed limits above 10,000 rejected with -31004; request body above 1 MiB gets HTTP 413', 'testnet'],
  ['JRP-019',  'B', 'JSON-RPC API',      'Bond events (cartesi_listBondEvents / cartesi_getBondEvent) match on-chain partial refunds, recovery and burn', 'devnet'],
  ['JRP-019',  'B', 'JSON-RPC API',      'Bond events (cartesi_listBondEvents / cartesi_getBondEvent) match on-chain partial refunds, recovery and burn', 'testnet'],
  ['JRP-020',  'B', 'JSON-RPC API',      'Requests without id get id:null responses (no notification semantics)', 'devnet'],
  ['JRP-020',  'B', 'JSON-RPC API',      'Requests without id get id:null responses (no notification semantics)', 'testnet'],

  // ── Multi-App ─────────────────────────────────────────────────────────────
  ['MA-001',   'B', 'Multi-App',         'Heavy app does not starve light app under concurrent load', 'testnet'],
  ['MA-002',   'B', 'Multi-App',         'Restart node with many pending inputs across two apps — document processing order (serial vs fair)', 'testnet'],

  // ── Quorum ────────────────────────────────────────────────────────────────
  ['QUO-001',  'B', 'Quorum',            'Pending quorum votes do not mark the app DIVERGED during honest divergence; only a different winning claim does (CLAIM_REJECTED + DIVERGED)', 'testnet'],
  ['QUO-002',  'B', 'Quorum',            'Winning quorum claim stages first, then acceptClaim after staging period', 'testnet'],
  ['QUO-003',  'B', 'Quorum',            'Quorum.submitClaim enforces the same machine validity proof requirement as Authority under multi-validator voting', 'testnet'],

  // ── Deployment ────────────────────────────────────────────────────────────
  ['DEP-001',  'B', 'Deployment',        'Deploy to local Anvil — deployment completes, app addresses correct', 'devnet'],
  ['DEP-002',  'B', 'Deployment',        'Machine hash matches across two different build environments (cartesi hash output identical)', 'devnet'],
  ['DEP-003',  'B', 'Deployment',        'Deploy to Base Sepolia — services healthy and test input processed', 'testnet'],
  ['DEP-004',  'B', 'Deployment',        'Deploy to Optimism Sepolia — services healthy and test input processed', 'testnet'],
  ['DEP-005',  'B', 'Deployment',        'Deploy using forked-testnet workflow — deploy, process input, restart and verify cursor recovery', 'testnet'],
  ['DEP-006',  'B', 'Deployment',        'Deploy against contracts alpha.10 using the inputBox factory parameter', 'devnet'],
  ['DEP-006',  'B', 'Deployment',        'Deploy against contracts alpha.10 using the inputBox factory parameter', 'testnet'],

  // ── Internal CLI ──────────────────────────────────────────────────────────
  ['ILC-001',  'B', 'Internal CLI',      'The node and cartesi-rollups-cli db check-version refuse a database whose schema differs from the binary\'s, before doing anything else (no deploys or writes against it)', 'testnet'],
  ['ILC-002',  'B', 'Internal CLI',      'cartesi-rollups-cli app register then app list — appears as ENABLED, pagination flags correct', 'testnet'],
  ['ILC-003',  'B', 'Internal CLI',      'cartesi-rollups-cli app status disabled then app remove: enabled=false stops processing; remove deletes only a disabled application', 'testnet'],
  ['ILC-004',  'B', 'Internal CLI',      'cartesi-rollups-cli validate — Merkle proof validated against on-chain contract, receipt returned', 'testnet'],
  ['ILC-005',  'B', 'Internal CLI',      'cartesi-rollups-cli execute — voucher executed on-chain via operator CLI, tx receipt returned', 'devnet'],
  ['ILC-005',  'B', 'Internal CLI',      'cartesi-rollups-cli execute — voucher executed on-chain via operator CLI, tx receipt returned', 'testnet'],
  ['ILC-006',  'B', 'Internal CLI',      'cartesi-rollups-cli send --hex --no-wait: payload accepted, returns without a receipt', 'devnet'],
  ['ILC-006',  'B', 'Internal CLI',      'cartesi-rollups-cli send --hex --no-wait: payload accepted, returns without a receipt', 'testnet'],
  ['ILC-007',  'B', 'Internal CLI',      'cartesi-rollups-cli deploy quorum — quorum contract deployed and registered correctly', 'testnet'],
  ['ILC-008',  'B', 'Internal CLI',      'cartesi-rollups-cli deploy application with v3 flags — claim staging period and withdrawal config validated', 'testnet'],
  ['ILC-009',  'B', 'Internal CLI',      'cartesi-rollups-cli read epochs — staged/accepted/foreclosed states visible as lifecycle progresses', 'testnet'],
  ['ILC-010',  'B', 'Internal CLI',      'cartesi-rollups-cli app list and cartesi_getApplication show the v3 fields (enabled, status, withdrawal config, foreclose markers); contract shows the on-chain view only', 'devnet'],
  ['ILC-010',  'B', 'Internal CLI',      'cartesi-rollups-cli app list and cartesi_getApplication show the v3 fields (enabled, status, withdrawal config, foreclose markers); contract shows the on-chain view only', 'testnet'],
  ['ILC-011',  'B', 'Internal CLI',      'Gas estimated by default; exact manual limit skips estimation (gas spent on reverts); CARTESI_BLOCKCHAIN_LEGACY_ENABLED forces legacy fees', 'devnet'],
  ['ILC-011',  'B', 'Internal CLI',      'Gas estimated by default; exact manual limit skips estimation (gas spent on reverts); CARTESI_BLOCKCHAIN_LEGACY_ENABLED forces legacy fees', 'testnet'],
  ['ILC-012',  'B', 'Internal CLI',      'Self-hosted deployment failure surfaces the original on-chain revert reason, not a generic error', 'devnet'],
  ['ILC-012',  'B', 'Internal CLI',      'Self-hosted deployment failure surfaces the original on-chain revert reason, not a generic error', 'testnet'],
  ['ILC-013',  'B', 'Internal CLI',      'refund --input-file returns an unfinalized deposit after foreclosure; repeat rejected with RefundAlreadyIssued', 'devnet'],
  ['ILC-013',  'B', 'Internal CLI',      'refund --input-file returns an unfinalized deposit after foreclosure; repeat rejected with RefundAlreadyIssued', 'testnet'],
  ['ILC-014',  'B', 'Internal CLI',      'foreclose / prove-drive-root / withdraw confirm before acting; prove-drive-root checks its event; app status explains FAILED', 'devnet'],
  ['ILC-014',  'B', 'Internal CLI',      'foreclose / prove-drive-root / withdraw confirm before acting; prove-drive-root checks its event; app status explains FAILED', 'testnet'],
  ['ILC-015',  'B', 'Internal CLI',      'deploy application with a direct InputBox (Authority, Quorum, PRT); --no-wait requires --register=false', 'testnet'],
  ['ILC-016',  'B', 'Internal CLI',      'send and execute --proof-file by address without database; explicit --inputbox rejected; stdout is pipeable', 'devnet'],
  ['ILC-016',  'B', 'Internal CLI',      'send and execute --proof-file by address without database; explicit --inputbox rejected; stdout is pipeable', 'testnet'],
  ['ILC-017',  'B', 'Internal CLI',      'read shows PRT match advance events matching the chain', 'devnet'],
  ['ILC-019',  'B', 'Internal CLI',      'refund rejection paths: NotForeclosed, CannotRefundFinalizedInput, InvalidInputHash, UnknownInputSender', 'devnet'],
  ['ILC-019',  'B', 'Internal CLI',      'refund rejection paths: NotForeclosed, CannotRefundFinalizedInput, InvalidInputHash, UnknownInputSender', 'testnet'],
  ['ILC-020',  'B', 'Internal CLI',      'Receipt wait timeout reports an unknown outcome with the signed hash, not a failure', 'testnet'],
  ['ILC-021',  'B', 'Internal CLI',      'deposit erc20 --approve checks Approval then InputAdded; rejects --no-wait; names the failing step', 'devnet'],
  ['ILC-021',  'B', 'Internal CLI',      'deposit erc20 --approve checks Approval then InputAdded; rejects --no-wait; names the failing step', 'testnet'],

  // ── Machine Tool ──────────────────────────────────────────────────────────
  ['MTL-001',  'B', 'Machine Tool',      'cartesi-rollups-machine-tool replay writes deterministic snapshot for accepted epoch', 'devnet'],
  ['MTL-001',  'B', 'Machine Tool',      'cartesi-rollups-machine-tool replay writes deterministic snapshot for accepted epoch', 'testnet'],
  ['MTL-002',  'B', 'Machine Tool',      'cartesi-rollups-machine-tool prove accounts-drive outputs proofs accepted by prove-drive-root and withdraw', 'devnet'],
  ['MTL-002',  'B', 'Machine Tool',      'cartesi-rollups-machine-tool prove accounts-drive outputs proofs accepted by prove-drive-root and withdraw', 'testnet'],

  // ── Foreclosure ───────────────────────────────────────────────────────────
  ['FOR-001',  'B', 'Foreclosure',       'Authority path: claim submitted and staged in the same transaction (CLAIM_COMPUTED -> CLAIM_STAGED), acceptClaim only after the staging period, then CLAIM_ACCEPTED', 'devnet'],
  ['FOR-001',  'B', 'Foreclosure',       'Authority path: claim submitted and staged in the same transaction (CLAIM_COMPUTED -> CLAIM_STAGED), acceptClaim only after the staging period, then CLAIM_ACCEPTED', 'testnet'],
  ['FOR-002',  'B', 'Foreclosure',       'Foreclose before the claim is staged: foreclosure markers set (foreclose_transaction / foreclose_block; there is no FORECLOSED app status) and work that cannot finalize is marked CLAIM_FORECLOSED', 'devnet'],
  ['FOR-002',  'B', 'Foreclosure',       'Foreclose before the claim is staged: foreclosure markers set (foreclose_transaction / foreclose_block; there is no FORECLOSED app status) and work that cannot finalize is marked CLAIM_FORECLOSED', 'testnet'],
  ['FOR-003',  'B', 'Foreclosure',       'Foreclose during a staged (not yet accepted) claim: foreclosure markers set and the staged work that cannot finalize becomes CLAIM_FORECLOSED', 'devnet'],
  ['FOR-003',  'B', 'Foreclosure',       'Foreclose during a staged (not yet accepted) claim: foreclosure markers set and the staged work that cannot finalize becomes CLAIM_FORECLOSED', 'testnet'],
  ['FOR-004',  'B', 'Foreclosure',       'Foreclose after accepted claim -> accepted history preserved', 'devnet'],
  ['FOR-004',  'B', 'Foreclosure',       'Foreclose after accepted claim -> accepted history preserved', 'testnet'],
  ['FOR-005',  'B', 'Foreclosure',       'Foreclose authorization boundary -> non-guardian fails, guardian succeeds', 'devnet'],
  ['FOR-005',  'B', 'Foreclosure',       'Foreclose authorization boundary -> non-guardian fails, guardian succeeds', 'testnet'],
  ['FOR-006',  'B', 'Foreclosure',       'Wrong epoch drive-root proof rejected', 'devnet'],
  ['FOR-006',  'B', 'Foreclosure',       'Wrong epoch drive-root proof rejected', 'testnet'],
  ['FOR-007',  'B', 'Foreclosure',       'Wrong app proof reuse rejected', 'devnet'],
  ['FOR-007',  'B', 'Foreclosure',       'Wrong app proof reuse rejected', 'testnet'],
  ['FOR-008',  'B', 'Foreclosure',       'Emergency withdraw before drive-root proof rejected', 'devnet'],
  ['FOR-008',  'B', 'Foreclosure',       'Emergency withdraw before drive-root proof rejected', 'testnet'],
  ['FOR-009',  'B', 'Foreclosure',       'Wrong epoch account proof rejected', 'devnet'],
  ['FOR-009',  'B', 'Foreclosure',       'Wrong epoch account proof rejected', 'testnet'],
  ['FOR-010',  'B', 'Foreclosure',       'Emergency withdrawal single-use per account', 'devnet'],
  ['FOR-010',  'B', 'Foreclosure',       'Emergency withdrawal single-use per account', 'testnet'],
  ['FOR-011',  'B', 'Foreclosure',       'Restart/catch-up preserves foreclosure, proof, and withdrawal truth', 'devnet'],
  ['FOR-011',  'B', 'Foreclosure',       'Restart/catch-up preserves foreclosure, proof, and withdrawal truth', 'testnet'],
  ['FOR-012',  'B', 'Foreclosure',       'Emergency withdrawal API parity (operator path vs JSON-RPC)', 'devnet'],
  ['FOR-012',  'B', 'Foreclosure',       'Emergency withdrawal API parity (operator path vs JSON-RPC)', 'testnet'],
  ['FOR-013',  'B', 'Foreclosure',       'Bad emergency config fails fast with explicit errors', 'devnet'],
  ['FOR-013',  'B', 'Foreclosure',       'Bad emergency config fails fast with explicit errors', 'testnet'],
  ['FOR-014',  'B', 'Foreclosure',       'Repeated accept failures do not create infinite gas-spending loops', 'devnet'],
  ['FOR-014',  'B', 'Foreclosure',       'Repeated accept failures do not create infinite gas-spending loops', 'testnet'],
  ['FOR-015',  'B', 'Foreclosure',       'Validate/execute output from staged (not accepted) epoch — both revert with clear errors', 'devnet'],
  ['FOR-015',  'B', 'Foreclosure',       'Validate/execute output from staged (not accepted) epoch — both revert with clear errors', 'testnet'],
  ['FOR-016',  'B', 'Foreclosure',       'Guardian foreclosure front-runs node acceptClaim — foreclosure succeeds, accept reverts, app/claim marked foreclosed', 'devnet'],
  ['FOR-016',  'B', 'Foreclosure',       'Guardian foreclosure front-runs node acceptClaim — foreclosure succeeds, accept reverts, app/claim marked foreclosed', 'testnet'],
  ['FOR-017',  'B', 'Foreclosure',       'Post-foreclosure USDC emergency withdrawal — account proof accepted and withdrawal output executed', 'devnet'],
  ['FOR-017',  'B', 'Foreclosure',       'Post-foreclosure USDC emergency withdrawal — account proof accepted and withdrawal output executed', 'testnet'],
  ['FOR-018',  'B', 'Foreclosure',       'Authority claim submission accepts a valid machine validity proof (manually yielded, RX accepted)', 'devnet'],
  ['FOR-018',  'B', 'Foreclosure',       'Authority claim submission accepts a valid machine validity proof (manually yielded, RX accepted)', 'testnet'],
  ['FOR-019',  'B', 'Foreclosure',       'Authority claim submission rejects a machine that was not yielded, or yielded with the wrong reason', 'devnet'],
  ['FOR-019',  'B', 'Foreclosure',       'Authority claim submission rejects a machine that was not yielded, or yielded with the wrong reason', 'testnet'],
  ['FOR-020',  'B', 'Foreclosure',       'Authority claim submission rejects a malformed machine Merkle proof (InvalidMachineMerkleProof)', 'devnet'],
  ['FOR-020',  'B', 'Foreclosure',       'Authority claim submission rejects a malformed machine Merkle proof (InvalidMachineMerkleProof)', 'testnet'],
  ['FOR-021',  'B', 'Foreclosure',       'Authority claim submission rejects a siblings array of the wrong length (InvalidSiblingsArrayLength)', 'devnet'],
  ['FOR-021',  'B', 'Foreclosure',       'Authority claim submission rejects a siblings array of the wrong length (InvalidSiblingsArrayLength)', 'testnet'],
  ['FOR-023',  'B', 'Foreclosure',       'Deposits after foreclosure revert at the InputBox (ApplicationForeclosed) for Ether/ERC-20/ERC-721/ERC-1155; deposits not yet finalized at foreclosure can be refunded in full to the depositor (issueRefund / cartesi-rollups-cli refund)', 'devnet'],
  ['FOR-023',  'B', 'Foreclosure',       'Deposits after foreclosure revert at the InputBox (ApplicationForeclosed) for Ether/ERC-20/ERC-721/ERC-1155; deposits not yet finalized at foreclosure can be refunded in full to the depositor (issueRefund / cartesi-rollups-cli refund)', 'testnet'],
  ['FOR-024',  'B', 'Foreclosure',       'Deposit refund boundary: finalized deposits refund via emergency withdrawal, non-finalized refund directly on L1', 'devnet'],
  ['FOR-024',  'B', 'Foreclosure',       'Deposit refund boundary: finalized deposits refund via emergency withdrawal, non-finalized refund directly on L1', 'testnet'],
  ['FOR-025',  'B', 'Foreclosure',       'Terminal application recovered through foreclosure: prior balances withdrawn, post-terminal deposit refunded', 'devnet'],
  ['FOR-025',  'B', 'Foreclosure',       'Terminal application recovered through foreclosure: prior balances withdrawn, post-terminal deposit refunded', 'testnet'],
  ['FOR-026',  'B', 'Foreclosure',       'Deposit rejected by the app in an accepted epoch cannot be refunded; record where the funds remain', 'devnet'],
  ['FOR-026',  'B', 'Foreclosure',       'Deposit rejected by the app in an accepted epoch cannot be refunded; record where the funds remain', 'testnet'],
  ['FOR-027',  'B', 'Foreclosure',       'App that emits outputs and then writes a wrong outputs Merkle root: INVALID_OUTPUTS_ROOT shown through JSON-RPC; after foreclosure, epochs that cannot finalize become CLAIM_FORECLOSED, balances from the last accepted epoch are withdrawable, outputs of the bad epoch never execute, and a fixed redeploy runs on the same node', 'devnet'],
  ['FOR-027',  'B', 'Foreclosure',       'App that emits outputs and then writes a wrong outputs Merkle root: INVALID_OUTPUTS_ROOT shown through JSON-RPC; after foreclosure, epochs that cannot finalize become CLAIM_FORECLOSED, balances from the last accepted epoch are withdrawable, outputs of the bad epoch never execute, and a fixed redeploy runs on the same node', 'testnet'],

  // ── Terminal States ───────────────────────────────────────────────────────
  ['TRM-001',  'B', 'Terminal States',   'Unhandled exception in a template app: record the resulting state; no later input executed', 'devnet'],
  ['TRM-001',  'B', 'Terminal States',   'Unhandled exception in a template app: record the resulting state; no later input executed', 'testnet'],
  ['TRM-002',  'B', 'Terminal States',   'Guest halts the machine: MACHINE_HALTED, no input executed before or after a restart', 'devnet'],
  ['TRM-003',  'B', 'Terminal States',   'Unexpected manual yield: UNEXPECTED_YIELD, no later input executed', 'devnet'],
  ['TRM-004',  'B', 'Terminal States',   'Mcycle overflow: MCYCLE_OVERFLOW, or record that it is not reachable in practice', 'devnet'],
  ['TRM-005',  'B', 'Terminal States',   'Accepted input with an invalid outputs root: INVALID_OUTPUTS_ROOT recorded once, no claim, survives restart', 'devnet'],
  ['TRM-006',  'B', 'Terminal States',   'Operator view of each terminal state: CLI status, JSON-RPC and log identify state, input and next step', 'devnet'],
  ['TRM-006',  'B', 'Terminal States',   'Operator view of each terminal state: CLI status, JSON-RPC and log identify state, input and next step', 'testnet'],
  ['TRM-007',  'B', 'Terminal States',   'Configured execution limit aborts the advance: input stays NONE, app FAILED, processed after fix and re-enable', 'devnet'],
  ['TRM-007',  'B', 'Terminal States',   'Configured execution limit aborts the advance: input stays NONE, app FAILED, processed after fix and re-enable', 'testnet'],

  // ── PRT ───────────────────────────────────────────────────────────────────
  ['PRT-001',  'B', 'PRT',               'PRT epochs settle on a testnet; at least one epoch with the reference node alone sending join, stage, accept and recover', 'testnet'],
  ['PRT-002',  'B', 'PRT',               'Node recovers its own root bond once (also across restart); join/stage/accept first; external callers still pay the owner', 'devnet'],
  ['PRT-002',  'B', 'PRT',               'Node recovers its own root bond once (also across restart); join/stage/accept first; external callers still pay the owner', 'testnet'],
  ['PRT-003',  'B', 'PRT',               'Reference node alone does not defend: adversary can win, stage and accept; record DIVERGED and any operator warning', 'devnet'],
  ['PRT-004',  'B', 'PRT',               'Sling-driven dispute visible through JSON-RPC, matching on-chain events', 'devnet'],
  ['PRT-004',  'B', 'PRT',               'Sling-driven dispute visible through JSON-RPC, matching on-chain events', 'testnet'],
  ['PRT-005',  'B', 'PRT',               'Node started after the epoch-0 join window: missed join marks the app FAILED unless a peer joined the same commitment', 'devnet'],
  ['PRT-006',  'B', 'PRT',               'Default staging period 0: acceptance is allowed from the staging block on (the node accepts a few blocks later); a non-zero period waits until B + P', 'devnet'],
  ['PRT-006',  'B', 'PRT',               'Default staging period 0: acceptance is allowed from the staging block on (the node accepts a few blocks later); a non-zero period waits until B + P', 'testnet'],
  ['PRT-007',  'B', 'PRT',               'All sentries reporting the winner accelerate acceptance; with no sentries the full period applies', 'devnet'],
  ['PRT-008',  'B', 'PRT',               'A dissenting or missing sentry report does not block acceptance after the period', 'devnet'],
  ['PRT-009',  'B', 'PRT',               'Root with no winner: node only warns and consensus stalls; guardian foreclosure is the only way out', 'devnet'],
  ['PRT-010',  'B', 'PRT',               'PRT transaction stuck pending: no fee replacement; tracking released after 64 blocks not found', 'testnet'],
  ['PRT-011',  'B', 'PRT',               'Reader mode: no broadcasts; reconciliation, observation and divergence diagnosis continue', 'devnet'],

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRACK C — Exploratory Charters  (2-hour time-boxed sessions)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Result column is not applicable for charters — use Notes to link the session note.
  ['CHR-001',  'C', 'Claimer',          'break-the-claimer.md — claimer under misconfiguration, partial failure, and restart conditions',                  '—'],
  ['CHR-002',  'C', 'EVM Reader',       'stress-evm-reader.md — WS drops, reorgs, slow RPC, and chain/DB divergence risk',                               '—'],
  ['CHR-003',  'C', 'CLI',              'misuse-the-cli.md — wrong command order, bad args, and confused-user UX paths',                                  '—'],
  ['CHR-004',  'C', 'Operations',       'operator-day-two.md — day-two operations: config drift, restarts, RPC failover',                     '—'],
  ['CHR-005',  'C', 'Multi-App',        'break-multi-app.md — starvation, scheduling fairness, and multi-app edge behavior',                              '—'],

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // REGRESSION WATCH  (re-check every cycle — remove when confirmed fixed)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ['RW-001',   'Regression', 'Internal CLI',      'CLI hardcoded a 30M gas limit, breaking transactions on networks with a lower per-tx gas cap (issue #786)', 'testnet'],
  ['RW-002',   'Regression', 'Inputs',            'Two or more addInput calls in one transaction wedge the app permanently (transaction_reference collision)', 'devnet'],
  ['RW-003',   'Regression', 'Machine Tool',      'machine-tool prove accounts-drive rejects account balances the contract and machine ledger both accept',   'devnet'],
  ['RW-004',   'Regression', 'Services',          'Execution-parameter (wall-clock) failures should mark the app FAILED, not the current behavior',           'devnet'],
];

// ─── Colours ──────────────────────────────────────────────────────────────────

const COLOR = {
  header:     '#1c2b3a',
  headerFg:   '#ffffff',

  divA:       '#2e7d32',   // dark green
  divB:       '#bf360c',   // dark orange
  divC:       '#6a1b9a',   // dark purple
  divReg:     '#880e4f',   // dark pink

  rowA1:      '#f1f8e9',   rowA2: '#e8f5e9',
  rowB1:      '#fff8f0',   rowB2: '#fff3e0',
  rowC1:      '#faf0ff',   rowC2: '#f3e5f5',
  rowReg1:    '#fdf0f4',   rowReg2: '#fce4ec',

  border:     '#d0d0d0',
};

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_LIST = ['Pending', 'Done', 'Out of Scope'];
const RESULT_LIST = ['Pass', 'Fail', 'Pass with Notes', 'Fail with Notes', 'Not Tested', 'N/A'];

const COL = { ID: 1, TRACK: 2, AREA: 3, NAME: 4, ENV: 5, OWNER: 6, STATUS: 7, RESULT: 8, NOTES: 9, DEVAD_NOTES: 10 };

// ─── Entry point ──────────────────────────────────────────────────────────────

function setupQASheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  _buildConfigSheet(ss);
  _buildTemplateSheet(ss);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert(
    '✅  Setup complete!\n\n' +
    'Sheets created: "Config" and "TEMPLATE".\n\n' +
    'To start a new sprint:\n' +
    '  1. Right-click the TEMPLATE tab → Duplicate\n' +
    '  2. Rename the copy (e.g. v2.1-rc1)\n' +
    '  3. Fill in Owner, Status, and Result\n\n' +
    'To add team members, edit column A in the Config sheet.'
  );
}

// ─── Config sheet ─────────────────────────────────────────────────────────────

function _buildConfigSheet(ss) {
  let s = ss.getSheetByName('Config');
  if (s) { s.clearContents(); s.clearFormats(); } else { s = ss.insertSheet('Config'); }

  // Header
  const hdr = s.getRange('A1');
  hdr.setValue('Owners')
     .setFontWeight('bold')
     .setFontColor(COLOR.headerFg)
     .setBackground(COLOR.header)
     .setHorizontalAlignment('center');

  // Default team slots — edit freely in the sheet
  const names = ['Lead', 'Tester 1', 'Tester 2', 'Tester 3', 'Platform'];
  names.forEach((n, i) => s.getRange(i + 2, 1).setValue(n));

  s.setColumnWidth(1, 180);

  // Leave 20 empty rows below so new names can be added without changing formulas
  s.getRange(1, 1, names.length + 21, 1)
   .setBorder(true, true, true, true, false, true, COLOR.border,
              SpreadsheetApp.BorderStyle.SOLID);
}

// ─── Template sheet ───────────────────────────────────────────────────────────

function _buildTemplateSheet(ss) {
  let s = ss.getSheetByName('TEMPLATE');
  if (s) {
    s.setFrozenColumns(0); // must unfreeze before any mergeAcross() calls
    s.setFrozenRows(0);
    s.clearContents();
    s.clearFormats();
    s.clearNotes();
  } else {
    s = ss.insertSheet('TEMPLATE');
  }

  // Column widths
  s.setColumnWidth(COL.ID,     90);
  s.setColumnWidth(COL.TRACK,  60);
  s.setColumnWidth(COL.AREA,  150);
  s.setColumnWidth(COL.NAME,  440);
  s.setColumnWidth(COL.ENV,    90);
  s.setColumnWidth(COL.OWNER, 150);
  s.setColumnWidth(COL.STATUS,130);
  s.setColumnWidth(COL.RESULT,165);
  s.setColumnWidth(COL.NOTES, 340);
  s.setColumnWidth(COL.DEVAD_NOTES, 340);

  // ── Header row ──────────────────────────────────────────────────────────────
  const HEADERS = ['ID', 'Track', 'Area / Component', 'Test / Charter', 'Env', 'Owner', 'Status', 'Result', 'Notes', 'DevAd Internal Notes'];
  const hdrRange = s.getRange(1, 1, 1, HEADERS.length);
  hdrRange.setValues([HEADERS])
          .setFontWeight('bold')
          .setFontColor(COLOR.headerFg)
          .setBackground(COLOR.header)
          .setFontSize(11)
          .setVerticalAlignment('middle')
          .setHorizontalAlignment('center')
          .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  s.setRowHeight(1, 38);
  s.setFrozenRows(1);
  // NOTE: setFrozenColumns is applied AFTER all rows are written.
  // Sheets throws "can't merge frozen and non-frozen columns" if you freeze
  // column 1 before calling mergeAcross() on the section-divider rows.

  // ── Write all rows ──────────────────────────────────────────────────────────
  const configSheet = ss.getSheetByName('Config');
  const ownerRange  = configSheet.getRange(2, 1, 25, 1); // generous range covers new names too

  let row = 2;
  let lastTrack = null;

  _orderedTestsForSheet(TESTS).forEach(([id, track, area, name, env]) => {
    if (track !== lastTrack) {
      _writeDivider(s, row, track);
      row++;
      lastTrack = track;
    }
    _writeRow(s, row, id, track, area, name, env, ownerRange);
    row++;
  });

  // Freeze column 1 now that all merges are done
  s.setFrozenColumns(1);

  // ── Conditional formatting ───────────────────────────────────────────────────
  const lastRow = row - 1;
  _applyConditionalFormatting(s, lastRow);

  // ── Outer border ────────────────────────────────────────────────────────────
  s.getRange(1, 1, lastRow, HEADERS.length)
   .setBorder(true, true, true, true, false, false, COLOR.border,
              SpreadsheetApp.BorderStyle.SOLID);
}

function _orderedTestsForSheet(tests) {
  const byTrack = new Map();

  tests.forEach((test) => {
    const [id, track] = test;
    if (!byTrack.has(track)) {
      byTrack.set(track, []);
    }
    byTrack.get(track).push(test);
  });

  const ordered = [];
  byTrack.forEach((trackTests, track) => {
    if (track === 'B') {
      ordered.push(...trackTests.filter((test) => test[4] === 'devnet'));
      ordered.push(...trackTests.filter((test) => test[4] === 'testnet'));
      ordered.push(...trackTests.filter((test) => test[4] !== 'devnet' && test[4] !== 'testnet'));
      return;
    }

    ordered.push(...trackTests);
  });

  return ordered;
}

// ─── Section divider row ────────────────────────────────────────────────────────

function _writeDivider(s, row, track) {
  const LABELS = {
    'A':          '▸  TRACK A — RELEASE SMOKE  ·  run every release candidate  ·  stop and triage if any test fails',
    'B':          '▸  TRACK B — DEEP VALIDATION  ·  run on major releases or when a significant component changed',
    'C':          '▸  TRACK C — EXPLORATORY CHARTERS  ·  2-hour time-boxed sessions  ·  output = session note + upstream bugs',
    'Regression': '▸  REGRESSION WATCH  ·  re-check every cycle  ·  remove entry when issue is confirmed fixed upstream',
  };
  const BG = { 'A': COLOR.divA, 'B': COLOR.divB, 'C': COLOR.divC, 'Regression': COLOR.divReg };

  const r = s.getRange(row, 1, 1, 10);
  r.setBackground(BG[track] || '#555555')
   .setFontColor('#ffffff')
   .setFontWeight('bold')
   .setFontSize(9)
   .setVerticalAlignment('middle')
   .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  // Put label in col 1 only — no merge, so column-freeze works
  s.getRange(row, 1)
   .setValue(LABELS[track] || `▸  TRACK ${track}`)
   .setHorizontalAlignment('left');
  s.setRowHeight(row, 26);
}
// ─── Test row ────────────────────────────────────────────────────────────────────

function _writeRow(s, row, id, track, area, name, env, ownerRange) {
  const BG = {
    'A':          row % 2 === 0 ? COLOR.rowA1 : COLOR.rowA2,
    'B':          row % 2 === 0 ? COLOR.rowB1 : COLOR.rowB2,
    'C':          row % 2 === 0 ? COLOR.rowC1 : COLOR.rowC2,
    'Regression': row % 2 === 0 ? COLOR.rowReg1 : COLOR.rowReg2,
  };

  const defaultStatus = 'Pending';
  const defaultResult = track === 'C' ? 'N/A' : 'Not Tested';

  s.getRange(row, 1, 1, 10)
   .setValues([[id, track, area, name, env, '', defaultStatus, defaultResult, '', '']])
   .setBackground(BG[track] || '#ffffff')
   .setVerticalAlignment('middle')
   .setFontSize(10);

  s.getRange(row, COL.ID).setFontWeight('bold');
  s.getRange(row, COL.ENV).setHorizontalAlignment('center');
  s.getRange(row, COL.NAME).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  s.setRowHeight(row, 22);

  // Owner — references Config sheet (survives tab duplication)
  s.getRange(row, COL.OWNER).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(ownerRange, true)
      .setAllowInvalid(false)
      .build()
  );

  // Status
  s.getRange(row, COL.STATUS).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(STATUS_LIST, true)
      .setAllowInvalid(false)
      .build()
  );

  // Result
  s.getRange(row, COL.RESULT).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(RESULT_LIST, true)
      .setAllowInvalid(false)
      .build()
  );
}

// ─── Conditional formatting ────────────────────────────────────────────────────

function _applyConditionalFormatting(s, lastRow) {
  const statusCol  = s.getRange(2, COL.STATUS, lastRow - 1, 1);
  const resultCol  = s.getRange(2, COL.RESULT, lastRow - 1, 1);
  const rules = [];

  // Status colours
  const statusMap = {
    'Done':         { bg: '#c8e6c9', fg: '#1b5e20' },
    'Out of Scope': { bg: '#eeeeee', fg: '#757575' },
    'Pending':      { bg: '#fff9c4', fg: '#f57f17' },
  };
  Object.entries(statusMap).forEach(([val, { bg, fg }]) => {
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(val)
        .setBackground(bg)
        .setFontColor(fg)
        .setRanges([statusCol])
        .build()
    );
  });

  // Result colours
  const resultMap = {
    'Pass':              { bg: '#c8e6c9', fg: '#1b5e20' },
    'Pass with Notes':   { bg: '#dcedc8', fg: '#33691e' },
    'Fail':              { bg: '#ffcdd2', fg: '#b71c1c' },
    'Fail with Notes':   { bg: '#ffe0b2', fg: '#bf360c' },
    'Not Tested':        { bg: '#fff9c4', fg: '#f57f17' },
    'N/A':              { bg: '#eeeeee', fg: '#9e9e9e' },
  };
  Object.entries(resultMap).forEach(([val, { bg, fg }]) => {
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(val)
        .setBackground(bg)
        .setFontColor(fg)
        .setRanges([resultCol])
        .build()
    );
  });

  s.setConditionalFormatRules(rules);
}
