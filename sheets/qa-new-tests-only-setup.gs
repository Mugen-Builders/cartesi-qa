/**
 * Cartesi QA - New Tests Only Template Setup
 *
 * Creates two sheets:
 * - Config
 * - NEW-TESTS
 *
 * Use this script when you want a spreadsheet containing only the newly added
 * Track B tests:
 *   INP-005..INP-008
 *   OUT-005
 *   EGR-005..EGR-011
 *   FOR-015..FOR-017
 */

const NEW_TESTS = [
  // Inputs
  ['INP-005', 'B', 'Inputs',      'Direct InputBox massive payload near tx-size practical limit - accepted and processed with exact bytes', 'devnet'],
  ['INP-005', 'B', 'Inputs',      'Direct InputBox massive payload near tx-size practical limit - accepted and processed with exact bytes', 'testnet'],
  ['INP-006', 'B', 'Inputs',      'Multiple addInput calls in one tx (spambox-style) - node keeps up and preserves on-chain order', 'devnet'],
  ['INP-006', 'B', 'Inputs',      'Multiple addInput calls in one tx (spambox-style) - node keeps up and preserves on-chain order', 'testnet'],
  ['INP-007', 'B', 'Inputs',      'USDC deposit into application - L1 accepts, node feeds machine, machine reports successful deposit', 'devnet'],
  ['INP-007', 'B', 'Inputs',      'USDC deposit into application - L1 accepts, node feeds machine, machine reports successful deposit', 'testnet'],
  ['INP-008', 'B', 'Inputs',      'USDC withdrawal request input - L1 accepts, node feeds machine, machine reports successful request', 'devnet'],
  ['INP-008', 'B', 'Inputs',      'USDC withdrawal request input - L1 accepts, node feeds machine, machine reports successful request', 'testnet'],

  // Outputs
  ['OUT-005', 'B', 'Outputs',     'Arbitrary blob output accepted and retrievable through JSON-RPC with exact bytes', 'devnet'],
  ['OUT-005', 'B', 'Outputs',     'Arbitrary blob output accepted and retrievable through JSON-RPC with exact bytes', 'testnet'],

  // Egress
  ['EGR-005', 'B', 'Egress',      'Validate arbitrary-blob output proof on L1 - proof accepted', 'devnet'],
  ['EGR-005', 'B', 'Egress',      'Validate arbitrary-blob output proof on L1 - proof accepted', 'testnet'],
  ['EGR-006', 'B', 'Egress',      'Execute non-executable outputs (empty, notice, blob) - each rejected with clear error and clean node failure record', 'devnet'],
  ['EGR-006', 'B', 'Egress',      'Execute non-executable outputs (empty, notice, blob) - each rejected with clear error and clean node failure record', 'testnet'],
  ['EGR-007', 'B', 'Egress',      'Validate USDC withdrawal voucher proof in app contract - accepted', 'devnet'],
  ['EGR-007', 'B', 'Egress',      'Validate USDC withdrawal voucher proof in app contract - accepted', 'testnet'],
  ['EGR-008', 'B', 'Egress',      'Execute USDC withdrawal voucher - L1 accepts and node marks output executed', 'devnet'],
  ['EGR-008', 'B', 'Egress',      'Execute USDC withdrawal voucher - L1 accepts and node marks output executed', 'testnet'],
  ['EGR-009', 'B', 'Egress',      'Attempt Ether withdrawal above app-contract balance - clear L1 revert and clean node failure record', 'devnet'],
  ['EGR-009', 'B', 'Egress',      'Attempt Ether withdrawal above app-contract balance - clear L1 revert and clean node failure record', 'testnet'],
  ['EGR-010', 'B', 'Egress',      'Attempt ERC-721 withdrawal for token not owned by app contract - clear L1 revert and clean node failure record', 'devnet'],
  ['EGR-010', 'B', 'Egress',      'Attempt ERC-721 withdrawal for token not owned by app contract - clear L1 revert and clean node failure record', 'testnet'],
  ['EGR-011', 'B', 'Egress',      'Attempt ERC-1155 withdrawal above app-contract balance - clear L1 revert and clean node failure record', 'devnet'],
  ['EGR-011', 'B', 'Egress',      'Attempt ERC-1155 withdrawal above app-contract balance - clear L1 revert and clean node failure record', 'testnet'],

  // Foreclosure
  ['FOR-015', 'B', 'Foreclosure', 'Validate/execute output from staged (not accepted) epoch - both revert with clear errors', 'devnet'],
  ['FOR-015', 'B', 'Foreclosure', 'Validate/execute output from staged (not accepted) epoch - both revert with clear errors', 'testnet'],
  ['FOR-016', 'B', 'Foreclosure', 'Guardian foreclosure front-runs node acceptClaim - foreclosure succeeds, accept reverts, app/claim marked foreclosed', 'devnet'],
  ['FOR-016', 'B', 'Foreclosure', 'Guardian foreclosure front-runs node acceptClaim - foreclosure succeeds, accept reverts, app/claim marked foreclosed', 'testnet'],
  ['FOR-017', 'B', 'Foreclosure', 'Post-foreclosure USDC emergency withdrawal - account proof accepted and withdrawal output executed', 'devnet'],
  ['FOR-017', 'B', 'Foreclosure', 'Post-foreclosure USDC emergency withdrawal - account proof accepted and withdrawal output executed', 'testnet'],
];

const STATUS_LIST = ['Pending', 'Done', 'Out of Scope'];
const RESULT_LIST = ['Pass', 'Fail', 'Pass with Notes', 'Fail with Notes', 'Not Tested', 'N/A'];

const COL = {
  ID: 1,
  TRACK: 2,
  AREA: 3,
  NAME: 4,
  ENV: 5,
  OWNER: 6,
  STATUS: 7,
  RESULT: 8,
  NOTES: 9,
};

function setupNewTestsOnlySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  buildConfigSheet_(ss);
  buildNewTestsSheet_(ss);
  SpreadsheetApp.flush();

  SpreadsheetApp.getUi().alert(
    'Setup complete.\n\n' +
    'Created sheets: Config and NEW-TESTS.\n' +
    'Rows included: only newly added Track B tests.'
  );
}

function buildConfigSheet_(ss) {
  let s = ss.getSheetByName('Config');
  if (s) {
    s.clearContents();
    s.clearFormats();
  } else {
    s = ss.insertSheet('Config');
  }

  s.getRange('A1').setValue('Owners').setFontWeight('bold');
  const defaultOwners = ['Lead', 'Tester 1', 'Tester 2', 'Tester 3', 'Platform'];
  defaultOwners.forEach((name, i) => s.getRange(i + 2, 1).setValue(name));
  s.setColumnWidth(1, 180);
}

function buildNewTestsSheet_(ss) {
  let s = ss.getSheetByName('NEW-TESTS');
  if (s) {
    s.clearContents();
    s.clearFormats();
    s.clearNotes();
  } else {
    s = ss.insertSheet('NEW-TESTS');
  }

  s.setColumnWidth(COL.ID, 90);
  s.setColumnWidth(COL.TRACK, 60);
  s.setColumnWidth(COL.AREA, 150);
  s.setColumnWidth(COL.NAME, 480);
  s.setColumnWidth(COL.ENV, 90);
  s.setColumnWidth(COL.OWNER, 150);
  s.setColumnWidth(COL.STATUS, 130);
  s.setColumnWidth(COL.RESULT, 165);
  s.setColumnWidth(COL.NOTES, 340);

  const headers = ['ID', 'Track', 'Area / Component', 'Test', 'Env', 'Owner', 'Status', 'Result', 'Notes'];
  s.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#1c2b3a')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  s.setRowHeight(1, 36);
  s.setFrozenRows(1);
  s.setFrozenColumns(1);

  const ownerRange = ss.getSheetByName('Config').getRange(2, 1, 25, 1);

  const rows = NEW_TESTS.map(([id, track, area, name, env]) => {
    return [id, track, area, name, env, '', 'Pending', 'Not Tested', ''];
  });

  s.getRange(2, 1, rows.length, 9).setValues(rows).setVerticalAlignment('middle').setFontSize(10);

  // Alternate row color
  for (let i = 0; i < rows.length; i++) {
    const rowIndex = i + 2;
    const bg = i % 2 === 0 ? '#fff8f0' : '#fff3e0';
    s.getRange(rowIndex, 1, 1, 9).setBackground(bg);
    s.getRange(rowIndex, COL.ID).setFontWeight('bold');
    s.getRange(rowIndex, COL.ENV).setHorizontalAlignment('center');
  }

  // Data validations
  for (let r = 2; r < rows.length + 2; r++) {
    s.getRange(r, COL.OWNER).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInRange(ownerRange, true).setAllowInvalid(false).build()
    );

    s.getRange(r, COL.STATUS).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(STATUS_LIST, true).setAllowInvalid(false).build()
    );

    s.getRange(r, COL.RESULT).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(RESULT_LIST, true).setAllowInvalid(false).build()
    );
  }

  // Conditional formatting for Status and Result
  const rules = [];
  const statusRange = s.getRange(2, COL.STATUS, rows.length, 1);
  const resultRange = s.getRange(2, COL.RESULT, rows.length, 1);

  rules.push(
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Done').setBackground('#c8e6c9').setFontColor('#1b5e20').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Out of Scope').setBackground('#eeeeee').setFontColor('#757575').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Pending').setBackground('#fff9c4').setFontColor('#f57f17').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Pass').setBackground('#c8e6c9').setFontColor('#1b5e20').setRanges([resultRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Pass with Notes').setBackground('#dcedc8').setFontColor('#33691e').setRanges([resultRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Fail').setBackground('#ffcdd2').setFontColor('#b71c1c').setRanges([resultRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Fail with Notes').setBackground('#ffe0b2').setFontColor('#bf360c').setRanges([resultRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Not Tested').setBackground('#fff9c4').setFontColor('#f57f17').setRanges([resultRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('N/A').setBackground('#eeeeee').setFontColor('#9e9e9e').setRanges([resultRange]).build()
  );

  s.setConditionalFormatRules(rules);

  s.getRange(1, 1, rows.length + 1, 9).setBorder(true, true, true, true, false, false, '#d0d0d0', SpreadsheetApp.BorderStyle.SOLID);
}
