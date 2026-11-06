const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');
const { calculateBpm, calculateStepLength } = require('./index');

test('estimates steps per minute from height and mile time', () => {
  assert.ok(Math.abs(calculateBpm(70, 10) - 170.78167115902964) < 1e-10);
});

test('divides unrounded cadence by the optional divisor', () => {
  const cadence = calculateBpm(70, 10);
  assert.equal(calculateBpm(70, 10, 1), cadence);
  assert.equal(calculateBpm(70, 10, undefined), cadence);
  for (const divisor of [2, 4, 5, 2.5, 0.5]) {
    assert.equal(calculateBpm(70, 10, divisor), cadence / divisor);
  }
});

test('rejects invalid divisors', () => {
  for (const divisor of [0, -1, NaN, Infinity, -Infinity, '2', null, true, {}, []]) {
    assert.throws(() => calculateBpm(70, 10, divisor), {
      name: 'RangeError',
      message: 'divisor must be a positive, finite number.'
    });
  }
});

test('rejects divisors that cause numeric overflow or underflow', () => {
  assert.throws(() => calculateBpm(70, 10, Number.MIN_VALUE), RangeError);
  assert.throws(() => calculateBpm(Number.MAX_VALUE, 10, Number.MAX_VALUE), RangeError);
});

test('estimates average leg length as the step length at the reference pace', () => {
  assert.equal(calculateStepLength(70, 10), 37.1);
});

test('step length grows with speed while cadence grows more slowly than speed', () => {
  const referenceStep = calculateStepLength(70, 10);
  const fasterStep = calculateStepLength(70, 5);
  assert.ok(Math.abs(fasterStep / referenceStep - 2 ** 0.75) < 1e-10);
  assert.ok(Math.abs(calculateBpm(70, 5) / calculateBpm(70, 10) - 2 ** 0.25) < 1e-10);
});

test('step length and cadence increase smoothly across running paces', () => {
  const paces = [15, 12, 10, 8, 6, 5];
  for (let i = 1; i < paces.length; i++) {
    assert.ok(calculateStepLength(70, paces[i]) > calculateStepLength(70, paces[i - 1]));
    assert.ok(calculateBpm(70, paces[i]) > calculateBpm(70, paces[i - 1]));
  }
});

test('step length and cadence cover one mile at the requested pace', () => {
  for (const height of [60, 68.5, 76]) {
    for (const pace of [5, 8, 10.5, 15]) {
      const inchesPerMile = calculateStepLength(height, pace) * calculateBpm(height, pace) * pace;
      assert.ok(Math.abs(inchesPerMile - 63360) < 1e-8);
    }
  }
});

test('accepts fractional heights and mile times without rounding the result', () => {
  const stepLength = 68.5 * 0.53 * (10 / 10.5) ** 0.75;
  assert.equal(calculateBpm(68.5, 10.5), 63360 / stepLength / 10.5);
});

test('faster pace increases cadence and taller height decreases it', () => {
  assert.ok(calculateBpm(70, 5) > calculateBpm(70, 10));
  assert.ok(calculateBpm(72, 10) < calculateBpm(68, 10));
  assert.ok(calculateStepLength(72, 10) > calculateStepLength(68, 10));
});

test('rejects invalid values for either input', () => {
  for (const value of [0, -1, NaN, Infinity, -Infinity, '70', null, undefined, true, {}, []]) {
    assert.throws(() => calculateBpm(value, 10), RangeError);
    assert.throws(() => calculateBpm(70, value), RangeError);
    assert.throws(() => calculateStepLength(value, 10), RangeError);
    assert.throws(() => calculateStepLength(70, value), RangeError);
  }
});

test('rejects numeric extremes that cannot produce a finite positive cadence', () => {
  assert.throws(() => calculateBpm(Number.MIN_VALUE, 10), RangeError);
  assert.throws(() => calculateBpm(70, Number.MIN_VALUE), RangeError);
  assert.throws(() => calculateBpm(Number.MAX_VALUE, Number.MAX_VALUE), RangeError);
  assert.throws(() => calculateStepLength(70, Number.MIN_VALUE), RangeError);
  assert.throws(() => calculateStepLength(Number.MAX_VALUE, 1), RangeError);
});

function runCli(args) {
  return spawnSync(process.execPath, [join(__dirname, 'index.js'), ...args], {
    encoding: 'utf8'
  });
}

test('CLI prints the estimated BPM', () => {
  const result = runCli(['70', '10']);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), 'Estimated BPM (steps per minute): 170.78');
  assert.equal(result.stderr, '');
});

test('CLI accepts decimal inputs', () => {
  const result = runCli(['68.5', '10.5']);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), 'Estimated BPM (steps per minute): 172.41');
});

test('CLI prints modified music BPM for divisors without labeling it as cadence', () => {
  for (const [divisor, expected] of [['2', '85.39'], ['4', '42.70'], ['5', '34.16'], ['2.5', '68.31']]) {
    const result = runCli(['70', '10', divisor]);
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), `Modified music BPM (cadence / ${divisor}): ${expected}`);
    assert.equal(result.stderr, '');
  }
});

test('CLI preserves cadence output for an explicit divisor of one', () => {
  const result = runCli(['70', '10', '1']);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), 'Estimated BPM (steps per minute): 170.78');
});

test('CLI rejects invalid inputs and incorrect argument counts', () => {
  for (const args of [[], ['70'], ['70', '10', '2', 'extra'], ['70', '10', 'extra'], ['abc', '10'], ['70', '0'], ['-70', '10'], ['70', '10:30']]) {
    const result = runCli(args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.notEqual(result.stderr, '');
  }
});

test('CLI rejects invalid divisors', () => {
  for (const divisor of ['0', '-2', 'NaN', 'Infinity', 'abc', '']) {
    const result = runCli(['70', '10', divisor]);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /divisor must be a positive, finite number/);
  }
});
