const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');
const { calculateBpm } = require('./index');
const { generateBpmTable } = require('./table');

test('default table covers 70 inches, 14 down to 7 minute miles, and divisors 2, 4, 5', () => {
  const rows = generateBpmTable();
  assert.equal(rows.length, 8);
  assert.deepEqual(rows.map((row) => row.minutesPerMile), [14, 13, 12, 11, 10, 9, 8, 7]);
  for (const row of rows) {
    assert.equal(row.heightInches, 70);
    assert.equal(row.cadenceBpm, calculateBpm(70, row.minutesPerMile));
    assert.deepEqual(Object.keys(row), [
      'heightInches', 'minutesPerMile', 'cadenceBpm', 'BPM / 2', 'BPM / 4', 'BPM / 5'
    ]);
    for (const divisor of [2, 4, 5]) {
      assert.equal(row[`BPM / ${divisor}`], calculateBpm(70, row.minutesPerMile, divisor));
    }
  }
  assert.equal(rows[4]['BPM / 2'].toFixed(2), '85.39');
});

test('custom variations retain input order and unrounded values without mutating inputs', () => {
  const paces = Object.freeze([7.5, 10.5, 12]);
  const divisors = Object.freeze([5, 2.5, 1]);
  const rows = generateBpmTable(68.5, paces, divisors);
  assert.deepEqual(rows.map((row) => row.minutesPerMile), paces);
  for (const row of rows) {
    assert.equal(row.heightInches, 68.5);
    for (const divisor of divisors) {
      assert.equal(row[`BPM / ${divisor}`], calculateBpm(68.5, row.minutesPerMile, divisor));
    }
  }
});

test('table rejects invalid heights, paces, divisors, and empty or nonarray variations', () => {
  for (const invalid of [0, -1, NaN, Infinity, '70', null, true, {}]) {
    assert.throws(() => generateBpmTable(invalid), RangeError);
  }
  for (const invalid of [[], null, {}, '10', 10]) {
    assert.throws(() => generateBpmTable(70, invalid), RangeError);
    assert.throws(() => generateBpmTable(70, [10], invalid), RangeError);
  }
  for (const invalid of [0, -1, NaN, Infinity, '2', null, undefined, true]) {
    assert.throws(() => generateBpmTable(70, [10, invalid]), RangeError);
    assert.throws(() => generateBpmTable(70, [10], [2, invalid]), RangeError);
  }
  assert.throws(() => generateBpmTable(70, [10], new Array(1)), RangeError);
});

test('default calls return independent tables', () => {
  const rows = generateBpmTable();
  rows[0]['BPM / 2'] = 0;
  assert.notEqual(generateBpmTable()[0]['BPM / 2'], 0);
});

test('table command displays default variations with two-decimal BPM values', () => {
  const result = spawnSync(process.execPath, [join(__dirname, 'table.js')], {
    encoding: 'utf8'
  });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  for (const heading of ['heightInches', 'minutesPerMile', 'cadenceBpm', 'BPM / 2', 'BPM / 4', 'BPM / 5']) {
    assert.ok(result.stdout.includes(heading));
  }
  assert.match(result.stdout, /170\.78/);
  assert.match(result.stdout, /85\.39/);
  assert.match(result.stdout, /42\.70/);
  assert.match(result.stdout, /34\.16/);
});
