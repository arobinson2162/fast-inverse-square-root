/**
 * Fast Inverse Square Root library.
 *
 * Exports a single function that approximates 1/sqrt(x) for a positive
 * finite 32-bit float using the Quake III bit-hack with one Newton
 * refinement step. ESM entry point.
 */
export { invSqrt } from './core.js';
export { ERROR_DOMAIN, ERROR_NON_FINITE, INV_SQRT_MAGIC } from './core.js';
