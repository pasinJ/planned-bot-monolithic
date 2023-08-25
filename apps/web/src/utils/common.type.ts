import { Decimal } from 'decimal.js';
import { z } from 'zod';

export const nonEmptyString = z.string().trim().min(1);
export const nonNegativePercentage = z
  .number()
  .nonnegative()
  .max(100)
  .transform((val) => new Decimal(val).toDecimalPlaces(8, Decimal.ROUND_UP).toNumber());
