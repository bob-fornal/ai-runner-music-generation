const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');
const { calculateBpm } = require('./index');

test('estimates steps per minute from height and mile time', () => {
  assert.ok(Math.abs(calculateBpm(70, 10) - 139.25274725274724) < 1e-10);
});

test('accepts fractional heights and mile times without rounding the result', () => {
  assert.equal(calculateBpm(68.5, 10.5), 63360 / (68.5 * 0.65) / 10.5);
});

test('faster pace increases cadence and taller height decreases it', () => {
  assert.equal(calculateBpm(70, 5), calculateBpm(70, 10) * 2);
  assert.ok(calculateBpm(72, 10) < calculateBpm(68, 10));
});

test('rejects invalid values for either input', () => {
  for (const value of [0, -1, NaN, Infinity, -Infinity, '70', null, undefined, true, {}, []]) {
    assert.throws(() => calculateBpm(value, 10), RangeError);
    assert.throws(() => calculateBpm(70, value), RangeError);
  }
});

test('rejects numeric extremes that cannot produce a finite positive cadence', () => {
  assert.throws(() => calculateBpm(Number.MIN_VALUE, 10), RangeError);
  assert.throws(() => calculateBpm(70, Number.MIN_VALUE), RangeError);
  assert.throws(() => calculateBpm(Number.MAX_VALUE, Number.MAX_VALUE), RangeError);
});

function runCli(args) {
  return spawnSync(process.execPath, [join(__dirname, 'index.js'), ...args], {
    encoding: 'utf8'
  });
}

test('CLI prints the estimated BPM', () => {
  const result = runCli(['70', '10']);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), 'Estimated BPM (steps per minute): 139.25');
  assert.equal(result.stderr, '');
});

test('CLI accepts decimal inputs', () => {
  const result = runCli(['68.5', '10.5']);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), 'Estimated BPM (steps per minute): 135.53');
});

test('CLI rejects invalid inputs and incorrect argument counts', () => {
  for (const args of [[], ['70'], ['70', '10', 'extra'], ['abc', '10'], ['70', '0'], ['-70', '10'], ['70', '10:30']]) {
    const result = runCli(args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.notEqual(result.stderr, '');
  }
});
