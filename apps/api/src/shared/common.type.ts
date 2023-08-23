import { Decimal } from 'decimal.js';
import { z } from 'zod';

export const nonEmptyString = z.string().trim().min(1);
export const nonNegativeInteger = z.number().nonnegative().int();
export const positiveFloat8Digits = z
  .number()
  .positive()
  .transform((val) => new Decimal(val).toDecimalPlaces(8, Decimal.ROUND_UP).toNumber());
export const nonNegativeFloat8Digits = z
  .number()
  .nonnegative()
  .transform((val) => new Decimal(val).toDecimalPlaces(8, Decimal.ROUND_UP).toNumber());
