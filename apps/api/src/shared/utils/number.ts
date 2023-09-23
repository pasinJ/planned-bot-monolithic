import { Decimal } from 'decimal.js';
import { z } from 'zod';

export const float8DigitsSchema = z
  .number()
  .transform((val) => new Decimal(val).toDecimalPlaces(8, Decimal.ROUND_UP).toNumber());

export const positiveFloat8DigitsSchema = float8DigitsSchema.pipe(z.number().positive());

export const nonNegativeFloat8DigitsSchema = float8DigitsSchema.pipe(z.number().nonnegative());

export const nonNegativePercentage8DigitsSchema = float8DigitsSchema.pipe(z.number().nonnegative().max(100));
