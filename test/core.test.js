import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invSqrt, ERROR_DOMAIN, ERROR_NON_FINITE, INV_SQRT_MAGIC } from '../src/index.js';

/** Relative error tolerance for the approximation. */
const REL_TOL = 2e-3;

function relativeError(actual, expected) {
  if (expected === 0) return Math.abs(actual);
  return Math.abs(actual - expected) / expected;
}

// Reference: exact single-precision 1/sqrt(x). Uses Math.sqrt on the
// rounded-to-f32 value so the comparison reflects what invSqrt actually
// targets (the bits of a 32-bit float), not the original double.
const f32Buf = new ArrayBuffer(4);
const f32 = new Float32Array(f32Buf);
function refInvSqrt(x) {
  f32[0] = x;
  return 1 / Math.sqrt(f32[0]);
}

test('INV_SQRT_MAGIC is the classic Quake III constant', () => {
  assert.equal(INV_SQRT_MAGIC, 0x5f3759df);
});

test('invSqrt approximates 1/sqrt(1) to within tolerance', () => {
  const got = invSqrt(1);
  assert.ok(relativeError(got, 1) < REL_TOL, `got ${got}, expected ~1`);
});

test('invSqrt approximates 1/sqrt(2) to within tolerance', () => {
  const got = invSqrt(2);
  const want = 1 / Math.sqrt(2);
  assert.ok(relativeError(got, want) < REL_TOL, `got ${got}, expected ~${want}`);
});

test('invSqrt approximates 1/sqrt(4) to within tolerance', () => {
  const got = invSqrt(4);
  assert.ok(relativeError(got, 0.5) < REL_TOL, `got ${got}, expected ~0.5`);
});

test('invSqrt approximates a large value, 1e12', () => {
  const got = invSqrt(1e12);
  const want = refInvSqrt(1e12);
  assert.ok(relativeError(got, want) < REL_TOL,
    `got ${got}, expected ~${want}`);
});

test('invSqrt approximates a tiny value, 1e-12', () => {
  const got = invSqrt(1e-12);
  const want = refInvSqrt(1e-12);
  assert.ok(relativeError(got, want) < REL_TOL,
    `got ${got}, expected ~${want}`);
});

test('invSqrt approximates a value just below 1 (0.25)', () => {
  const got = invSqrt(0.25);
  const want = refInvSqrt(0.25);
  assert.ok(relativeError(got, want) < REL_TOL,
    `got ${got}, expected ~${want}`);
});

test('invSqrt approximates a value just above 1 (1.21)', () => {
  const got = invSqrt(1.21);
  const want = refInvSqrt(1.21);
  assert.ok(relativeError(got, want) < REL_TOL,
    `got ${got}, expected ~${want}`);
});

test('invSqrt throws RangeError for 0', () => {
  assert.throws(() => invSqrt(0), { name: 'RangeError', message: ERROR_DOMAIN });
});

test('invSqrt throws RangeError for negative inputs', () => {
  assert.throws(() => invSqrt(-1), { name: 'RangeError', message: ERROR_DOMAIN });
  assert.throws(() => invSqrt(-1e-30), { name: 'RangeError', message: ERROR_DOMAIN });
});

test('invSqrt throws RangeError for NaN', () => {
  assert.throws(() => invSqrt(NaN), { name: 'RangeError', message: ERROR_NON_FINITE });
});

test('invSqrt throws RangeError for ±Infinity', () => {
  assert.throws(() => invSqrt(Infinity), { name: 'RangeError', message: ERROR_NON_FINITE });
  assert.throws(() => invSqrt(-Infinity), { name: 'RangeError', message: ERROR_NON_FINITE });
});

test('invSqrt rejects non-number inputs', () => {
  assert.throws(() => invSqrt('4'), { name: 'RangeError' });
});

test('invSqrt is monotone non-increasing on a sampled range', () => {
  // Pick powers of two in both directions so exact single-precision
  // rounding is predictable and the monotonicity check is stable.
  const xs = [1/16, 1/4, 1, 4, 16, 64, 256];
  const ys = xs.map(invSqrt);
  for (let i = 1; i < ys.length; i++) {
    assert.ok(ys[i] <= ys[i-1],
      `expected non-increasing: f(${xs[i]})=${ys[i]} vs f(${xs[i-1]})=${ys[i-1]}`);
  }
});
