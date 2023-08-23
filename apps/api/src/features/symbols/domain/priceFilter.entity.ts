import { z } from 'zod';

import { positiveFloat8Digits } from '#shared/common.type.js';

export const priceFilterSchema = z
  .object({
    type: z.literal('PRICE_FILTER'),
    minPrice: positiveFloat8Digits,
    maxPrice: positiveFloat8Digits,
    tickSize: positiveFloat8Digits,
  })
  .strict()
  .refine(
    ({ minPrice, maxPrice }) => maxPrice > minPrice,
    ({ minPrice, maxPrice }) => ({
      message: `maxPrice (${maxPrice}) must be greater than minPrice (${minPrice})`,
      path: ['maxPrice'],
    }),
  );
export type PriceFilter = z.infer<typeof priceFilterSchema>;
