# fast-inv-sqrt

Approximates `1/sqrt(x)` for a positive finite 32-bit float using the Quake III Arena bit-hack with one Newton-Raphson refinement. Returns a JavaScript number; relative error is under ~0.175% on the normal single-precision range.

## Usage

```js
import { invSqrt } from './src/index.js';

invSqrt(2);   // ~0.7069, true ~0.7071
invSqrt(0.25);// ~1.9966, true 2
invSqrt(1e12);// ~1e-6
```

## Why

`Math.sqrt(x)` then `1/that` is exact and fast on modern hardware — usually faster than this routine. This library exists for cases where you specifically want the classic approximation: education, bit-hack reproducibility, or environments where `Math.sqrt` is unavailable or slow relative to integer ops. The trade-off is accuracy: ~0.175% relative error, versus an exact result.

## Edge cases

`invSqrt` throws a `RangeError` for any input that is not a positive finite number:
- `NaN`, `±Infinity` — rejected because reinterpreting an infinity's bits yields a bogus finite number, and the input is clearly not a usable approximation target.
- `x <= 0` — rejected because `1/sqrt(x)` is undefined on the reals there.

The input is narrowed to IEEE-754 single precision before the bit-hack runs. The magic constant `0x5F3759DF` is calibrated for the single-precision format; using it on the bits of a 64-bit double would be wrong. Newton refinement is also evaluated in single precision so behaviour matches the classic 1999 routine, not a higher-precision rewrite.

## Exports

- `invSqrt(x: number): number` — the approximation function.
- `INV_SQRT_MAGIC: number` — the magic constant `0x5F3759DF`.
- `ERROR_DOMAIN: string` — message for `x <= 0`.
- `ERROR_NON_FINITE: string` — message for `NaN` / `±Infinity` / non-number inputs.
