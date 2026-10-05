/**
 * Core implementation of the Fast Inverse Square Root.
 *
 * Implements the Quake III Arena bit-hack: reinterpreting the IEEE-754
 * float bit pattern of x as an integer, shifting it right by one and
 * subtracting it from a magic constant. That yields a rough approximation
 * of 1/sqrt(x) in a single integer subtraction; one Newton-Raphson
 * iteration then refines it.
 */

/**
 * Magic constant for 0x5F3759DF — empirically derived for IEEE-754
 * single-precision. Using it on a 64-bit double's *low* 32 bits would be
 * wrong; we therefore round to f32 first via DataView.
 */
export const INV_SQRT_MAGIC = 0x5f3759df;

export const ERROR_DOMAIN = 'invSqrt: input must be positive and finite';
export const ERROR_NON_FINITE = 'invSqrt: input must be finite';

// A single 8-byte buffer shared across calls; safe because JS is
// single-threaded and no call pauses before reading back.
const _buf = new ArrayBuffer(8);
const _u32 = new Uint32Array(_buf);
const _f32 = new Float32Array(_buf);

/**
 * Read the low 32 bits of an IEEE-754 double as if it were a uint32.
 * Works on both little-endian and big-endian platforms; little-endian
 * puts the least-significant 32 bits at offset 0, big-endian puts them
 * at offset 4.
 */
function readLowU32(doubleValue) {
  _f32[0] = doubleValue;
  return _u32[0];
}

/**
 * Write a uint32 into the low 32 bits of the buffer's float slot and
 * read it back as a 32-bit float, then widen to a JS number.
 */
function u32ToF32(u32Value) {
  _u32[0] = u32Value;
  return _f32[0];
}

/**
 * Newton-Raphson refinement: y = y * (1.5 - 0.5 * x * y * y).
 * Evaluated in double precision so the refinement step improves the
 * initial approximation toward the true 1/sqrt(x) value.
 */
function newtonStep(xf32, yf32) {
  const halfX = 0.5 * xf32;
  return yf32 * (1.5 - halfX * yf32 * yf32);
}

/**
 * Approximate 1/sqrt(x) for a positive finite 32-bit float.
 *
 * Uses the Quake III bit-hack with one Newton iteration. The input is
 * first narrowed to IEEE-754 single precision so the bit-hack operates
 * on the bits of a *float*, not of a *double* — the magic constant
 * 0x5F3759DF is specific to the single-precision format.
 *
 * Edge cases handled explicitly:
 * - x <= 0 throws RangeError(ERROR_DOMAIN). 1/sqrt is undefined there.
 * - NaN / ±Infinity throws RangeError(ERROR_NON_FINITE). Reinterpreting
 *   an infinity's bits would produce a bogus finite number; the input is
 *   clearly not a usable approximation target.
 *
 * @param {number} x - A positive finite number.
 * @returns {number} Approximate 1/sqrt(x), within ~0.175% relative error
 *                   for inputs in the normal single-precision range.
 * @throws {RangeError} if x is non-positive or non-finite.
 */
export function invSqrt(x) {
  if (typeof x !== 'number' || Number.isNaN(x) || !Number.isFinite(x)) {
    throw new RangeError(ERROR_NON_FINITE);
  }
  if (x <= 0) {
    throw new RangeError(ERROR_DOMAIN);
  }

  // Narrow to single precision; the magic constant is calibrated for it.
  const xf32 = _f32[0] = x;
  const xBits = _u32[0];

  // i = 0x5F3759DF - (i >> 1)
  const yBits = (INV_SQRT_MAGIC - (xBits >>> 1)) >>> 0;
  const yf32 = u32ToF32(yBits);

  // One Newton iteration.
  return newtonStep(xf32, yf32);
}
