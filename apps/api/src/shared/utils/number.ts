import { Decimal } from 'decimal.js';
import { z } from 'zod';

export const float8DigitsSchema = z
  .number()
  .transform((val) => new Decimal(val).toDecimalPlaces(8, Decimal.ROUND_HALF_UP).toNumber());
export const positiveFloat8DigitsSchema = float8DigitsSchema.pipe(z.number().positive());
export const nonNegativeFloat8DigitsSchema = float8DigitsSchema.pipe(z.number().nonnegative());
export const nonNegativePercentage8DigitsSchema = float8DigitsSchema.pipe(z.number().nonnegative().max(100));

export const positiveIntSchema = z.number().positive().int();
export const nonNegativeIntSchema = z.number().nonnegative().int();

export function to8DigitDecimalNumber(n: Decimal): number {
  return n.toDecimalPlaces(8, Decimal.ROUND_HALF_UP).toNumber();
}

export function to2DigitDecimalNumber(n: Decimal): number {
  return n.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}
