import { Decimal } from 'decimal.js';
import { z } from 'zod';

export const nonEmptyString = z.string().trim().nonempty();
export const dateFromStringDate = z.string().datetime().pipe(z.coerce.date());

export const positiveFloat8Digits = z
  .number()
  .positive()
  .transform((val) => new Decimal(val).toDecimalPlaces(8, Decimal.ROUND_UP).toNumber());
export const nonNegativeFloat8Digits = z
  .number()
  .nonnegative()
  .transform((val) => new Decimal(val).toDecimalPlaces(8, Decimal.ROUND_UP).toNumber());
export const nonNegativePercentage8Digits = z
  .number()
  .nonnegative()
  .max(100)
  .transform((val) => new Decimal(val).toDecimalPlaces(8, Decimal.ROUND_UP).toNumber());

type Literal = z.infer<typeof literalSchema>;
const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export type Json = Literal | { [key: string]: Json } | Json[];
const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]),
);
