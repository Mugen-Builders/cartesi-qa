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
// Format: [id, track, area, test name / description]
// Tracks: 'A' | 'B' | 'C' | 'Regression'

const TESTS = [

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRACK A — Release Smoke  (run every release candidate)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ['CLI-005',  'A', 'CLI',              'cartesi create → build → run on a real developer machine'],
  ['INP-001',  'A', 'Inputs',           'One deposit of each token type: ETH, ERC20, ERC721, ERC1155'],
  ['EGR-001',  'A', 'Egress',           'End-to-end on testnet: notice proof + ETH withdrawal + ERC20 withdrawal'],
  ['DEP-001',  'A', 'Deployment',       'Self-hosted deploy to live testnet (Base Sepolia / Optimism Sepolia)'],

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRACK B — Deep Validation  (major releases / significant component changes)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ── CLI ──────────────────────────────────────────────────────────────────────
  ['CLI-001',  'B', 'CLI',              'cartesi doctor with Docker stopped — error message is human-readable, not a stack trace'],
  ['CLI-002',  'B', 'CLI',              'cartesi build with missing dependencies — error names the missing thing and how to fix it'],
  ['CLI-003',  'B', 'CLI',              'CLI / Node version mismatch — message names both versions, no silent wrong behavior'],
  ['CLI-004',  'B', 'CLI',              'cartesi create --branch with a nonexistent branch — clear "not found" message'],

  // ── Inputs ───────────────────────────────────────────────────────────────────
  ['INP-002',  'B', 'Inputs',           'Deposit with massive execLayerData near gas-limit boundary — accepted or clear error, no silent truncation'],
  ['INP-003',  'B', 'Inputs',           'Malformed / empty payload — node stays healthy, error surfaces to app cleanly'],
  ['INP-004',  'B', 'Inputs',           'Same-block inputs from multiple wallets — both processed in on-chain ordering'],
  ['INP-005',  'B', 'Inputs',           'ERC721 deposit with malformed metadata — input accepted, app response consistent'],

  // ── Outputs ──────────────────────────────────────────────────────────────────
  ['OUT-002',  'B', 'Outputs',          'Emit notice >2MB — HTTP 400, IOCTL error -105, advancer marks input rejected'],
  ['OUT-003',  'B', 'Outputs',          'Emit notice at exactly 2MB boundary — accepted, full content retrievable'],
  ['OUT-004',  'B', 'Outputs',          'Voucher with invalid/reverting destination — clean L1 revert, node healthy'],
  ['OUT-005',  'B', 'Outputs',          'Reports during advance-state and inspect-state — both retrievable via API'],

  // ── Egress ───────────────────────────────────────────────────────────────────
  ['EGR-002',  'B', 'Egress',           'Execute same voucher twice — second attempt reverts with clear reason'],
  ['EGR-003',  'B', 'Egress',           'Notice validation and voucher execution with block:latest vs block:finalized — document latency difference'],
  ['EGR-004',  'B', 'Egress',           'Execute voucher with insufficient L1 gas — clean revert, no inconsistent node state'],
  ['EGR-005',  'B', 'Egress',           'Withdrawal voucher for amount exceeding contract balance — L1 revert, node records failure cleanly'],

  // ── Configuration ────────────────────────────────────────────────────────────
  ['CFG-001',  'B', 'Configuration',    'CARTESI_LOG_LEVEL=debug — debug messages appear consistently across all services'],
  ['CFG-002',  'B', 'Configuration',    'CARTESI_LOG_LEVEL=warn — info suppressed; document which startup markers disappear'],
  ['CFG-003',  'B', 'Configuration',    'Missing CARTESI_AUTH_PRIVATE_KEY — claimer fails fast with clear message, other services start normally'],
  ['CFG-004',  'B', 'Configuration',    'Wrong CARTESI_BLOCKCHAIN_ID — evm-reader error names both chain IDs with timestamp + log level (see RW-003)'],
  ['CFG-005',  'B', 'Configuration',    'Invalid CARTESI_DATABASE_CONNECTION — services fail fast, no hang, host named in error'],
  ['CFG-006',  'B', 'Configuration',    'Custom CARTESI_ADVANCER_POLLING_INTERVAL — effective interval matches config and --help output (see RW-004)'],
  ['CFG-007',  'B', 'Configuration',    'CARTESI_BLOCKCHAIN_WS_MAX_RETRIES=1 — evm-reader retries once then logs clear failure, no panic'],
  ['CFG-008',  'B', 'Configuration',    'CARTESI_BLOCKCHAIN_WS_RECONNECT_INTERVAL custom value — reconnect timing matches config'],
  ['CFG-009',  'B', 'Configuration',    'CARTESI_AUTH_KIND=private-key set explicitly — claimer signs and submits claims, no auth errors'],

  // ── Services ─────────────────────────────────────────────────────────────────
  ['SVC-001',  'B', 'Services',         'Clean restart of each service individually while node is idle (7 services: advancer, claimer, evm-reader, validator, jsonrpc-api, database, prt)'],
  ['SVC-002',  'B', 'Services',         'Dirty restart of each service under active workload — no data loss, no stuck state (see RW-005, RW-006)'],

  // ── State Persistence ────────────────────────────────────────────────────────
  ['SP-002',   'B', 'State Persistence','Hard-kill all containers mid-execution — node recovers to consistent state'],
  ['SP-003',   'B', 'State Persistence','Per-input snapshots (--save-snapshot=every-input) — snapshot per input, restart from one resumes correctly'],
  ['SP-004',   'B', 'State Persistence','Per-epoch snapshots (--save-snapshot=every-epoch) — snapshot per epoch, restart from one resumes correctly'],
  ['SP-005',   'B', 'State Persistence','Claimer resync after >5 epochs offline — catches up without error, document catch-up time'],
  ['SP-006',   'B', 'State Persistence','L1 chain reorganization (testnet or Anvil simulation) — no duplicated or lost inputs, state consistent with new chain'],

  // ── Inspect Service ──────────────────────────────────────────────────────────
  ['INS-002',  'B', 'Inspect Service',  'POST /inspect with exactly-2MB payload — accepted and processed'],
  ['INS-003',  'B', 'Inspect Service',  'POST /inspect with >2MB payload — clear rejection; document response code (see RW-002)'],
  ['INS-004',  'B', 'Inspect Service',  'Concurrent inspects up to execution-parameters limit — all handled, no drops or crashes'],
  ['INS-005',  'B', 'Inspect Service',  'Inspect while advance is actively processing — queued, returns correct result after advance'],
  ['INS-006',  'B', 'Inspect Service',  'Inspect by 0x hex address vs app name — identical responses'],
  ['INS-007',  'B', 'Inspect Service',  'Inspect for unknown application — 404 or clear app-not-found error'],
  ['INS-008',  'B', 'Inspect Service',  'GET /inspect?payload=… returns same result as POST /inspect'],

  // ── JSON-RPC API ─────────────────────────────────────────────────────────────
  ['JRP-001',  'B', 'JSON-RPC API',     'Invalid JSON body → HTTP 400, code -32700 PARSE_ERROR'],
  ['JRP-002',  'B', 'JSON-RPC API',     'Non-existent method → code -32601 METHOD_NOT_FOUND'],
  ['JRP-003',  'B', 'JSON-RPC API',     'Wrong parameter type (decimal where hex expected) → code -32602 INVALID_PARAMS, offending param named'],
  ['JRP-004',  'B', 'JSON-RPC API',     'Error object shape matches JSON-RPC spec: exactly {code, message, [data]}, no extra fields'],
  ['JRP-005',  'B', 'JSON-RPC API',     'Pagination limit=0 — behavior consistent across list methods (document: coerce or reject)'],
  ['JRP-006',  'B', 'JSON-RPC API',     'Pagination offset > total count — empty data array, correct total_count, no error'],
  ['JRP-007',  'B', 'JSON-RPC API',     'Pagination negative offset → -32602 INVALID_PARAMS'],
  ['JRP-008',  'B', 'JSON-RPC API',     'Fetch non-existent index → -32001 (or equivalent not-found), not HTTP 500'],

  // ── Multi-App ────────────────────────────────────────────────────────────────
  ['MA-002',   'B', 'Multi-App',        'Heavy app does not starve light app under concurrent load'],
  ['MA-003',   'B', 'Multi-App',        'Restart node with many pending inputs across two apps — document processing order (serial vs fair)'],

  // ── Deployment ───────────────────────────────────────────────────────────────
  ['DEP-002',  'B', 'Deployment',       'Deploy to local Anvil — deployment completes, app addresses correct'],
  ['DEP-003',  'B', 'Deployment',       'Machine hash matches across two different build environments (cartesi hash output identical)'],

  // ── Internal Operator CLI ────────────────────────────────────────────────────
  ['ILC-001',  'B', 'Internal CLI',     'cartesi-rollups-cli db check detects manual schema version mismatch'],
  ['ILC-002',  'B', 'Internal CLI',     'cartesi-rollups-cli app register then app list — appears as ENABLED, pagination flags correct'],
  ['ILC-003',  'B', 'Internal CLI',     'cartesi-rollups-cli app remove — transitions to DISABLED, services stop processing it'],
  ['ILC-004',  'B', 'Internal CLI',     'cartesi-rollups-cli validate — Merkle proof validated against on-chain contract, receipt returned'],
  ['ILC-005',  'B', 'Internal CLI',     'cartesi-rollups-cli execute — voucher executed on-chain via operator CLI, tx receipt returned'],
  ['ILC-006',  'B', 'Internal CLI',     'cartesi-rollups-cli send --hex --async — payload accepted and decoded correctly in async mode'],

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRACK C — Exploratory Charters  (2-hour time-boxed sessions)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Result column is not applicable for charters — use Notes to link the session note.
  ['CHR-001',  'C', 'Claimer',          'Break the Claimer — auth edge cases, mid-claim kill/restart, extended offline, RPC drops'],
  ['CHR-002',  'C', 'Multi-App',        'Break Multi-App — starvation, N apps, failure isolation, restart ordering'],
  ['CHR-003',  'C', 'CLI',              'Misuse the CLI — wrong command order, bad args, help text accuracy, UX gaps'],
  ['CHR-004',  'C', 'Operations',       'Operator Day-Two — config changes after first boot, upgrades, long-idle behavior, internal CLI UX'],
  ['CHR-005',  'C', 'EVM Reader',       'Stress the EVM Reader — WS drops, reorgs, slow/flaky RPC, wrong chain ID error format'],

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // REGRESSION WATCH  (re-check every cycle — remove when confirmed fixed)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ['RW-001',   'Regression', 'Services',          'jsonrpc-api does not shut down gracefully — confirm fixed or still open'],
  ['RW-002',   'Regression', 'Inspect Service',   'POST /inspect >2MB returns 200+error-in-body instead of 413 — confirm HTTP-level rejection now'],
  ['RW-003',   'Regression', 'Configuration',     'Wrong CARTESI_BLOCKCHAIN_ID: error message missing timestamp and log level'],
  ['RW-004',   'Regression', 'Configuration',     'CARTESI_ADVANCER_POLLING_INTERVAL default (3s on Base Sepolia) does not match --help (7s)'],
  ['RW-005',   'Regression', 'Services',          'evm-reader reads inputs out of order after dirty restart'],
  ['RW-006',   'Regression', 'Services',          'Advancer halts after database hard-restart with active connections'],
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

const COL = { ID: 1, TRACK: 2, AREA: 3, NAME: 4, OWNER: 5, STATUS: 6, RESULT: 7, NOTES: 8 };

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
  if (s) { s.clearContents(); s.clearFormats(); s.clearNotes(); }
  else    { s = ss.insertSheet('TEMPLATE'); }

  // Column widths
  s.setColumnWidth(COL.ID,     90);
  s.setColumnWidth(COL.TRACK,  60);
  s.setColumnWidth(COL.AREA,  150);
  s.setColumnWidth(COL.NAME,  470);
  s.setColumnWidth(COL.OWNER, 150);
  s.setColumnWidth(COL.STATUS,130);
  s.setColumnWidth(COL.RESULT,165);
  s.setColumnWidth(COL.NOTES, 340);

  // ── Header row ──────────────────────────────────────────────────────────────
  const HEADERS = ['ID', 'Track', 'Area / Component', 'Test / Charter', 'Owner', 'Status', 'Result', 'Notes'];
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

  TESTS.forEach(([id, track, area, name]) => {
    if (track !== lastTrack) {
      _writeDivider(s, row, track);
      row++;
      lastTrack = track;
    }
    _writeRow(s, row, id, track, area, name, ownerRange);
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

// ─── Section divider row ────────────────────────────────────────────────────────

function _writeDivider(s, row, track) {
  const LABELS = {
    'A':          '▸  TRACK A — RELEASE SMOKE  ·  run every release candidate  ·  stop and triage if any test fails',
    'B':          '▸  TRACK B — DEEP VALIDATION  ·  run on major releases or when a significant component changed',
    'C':          '▸  TRACK C — EXPLORATORY CHARTERS  ·  2-hour time-boxed sessions  ·  output = session note + upstream bugs',
    'Regression': '▸  REGRESSION WATCH  ·  re-check every cycle  ·  remove entry when issue is confirmed fixed upstream',
  };
  const BG = { 'A': COLOR.divA, 'B': COLOR.divB, 'C': COLOR.divC, 'Regression': COLOR.divReg };

  const r = s.getRange(row, 1, 1, 8);
  r.mergeAcross();
  r.setValue(LABELS[track] || `▸  TRACK ${track}`)
   .setFontWeight('bold')
   .setFontColor('#ffffff')
   .setBackground(BG[track] || '#555555')
   .setFontSize(9)
   .setVerticalAlignment('middle')
   .setHorizontalAlignment('left')
   .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  s.setRowHeight(row, 26);
}

// ─── Test row ────────────────────────────────────────────────────────────────────

function _writeRow(s, row, id, track, area, name, ownerRange) {
  const BG = {
    'A':          row % 2 === 0 ? COLOR.rowA1 : COLOR.rowA2,
    'B':          row % 2 === 0 ? COLOR.rowB1 : COLOR.rowB2,
    'C':          row % 2 === 0 ? COLOR.rowC1 : COLOR.rowC2,
    'Regression': row % 2 === 0 ? COLOR.rowReg1 : COLOR.rowReg2,
  };

  const defaultStatus = 'Pending';
  const defaultResult = track === 'C' ? 'N/A' : 'Not Tested';

  s.getRange(row, 1, 1, 8)
   .setValues([[id, track, area, name, '', defaultStatus, defaultResult, '']])
   .setBackground(BG[track] || '#ffffff')
   .setVerticalAlignment('middle')
   .setFontSize(10);

  s.getRange(row, COL.ID).setFontWeight('bold');
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
