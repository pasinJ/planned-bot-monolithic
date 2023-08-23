import { z } from 'zod';

import { nonNegativeFloat8Digits, positiveFloat8Digits } from '#shared/common.type.js';

export const marketLotSizeFilterSchema = z
  .object({
    type: z.literal('MARKET_LOT_SIZE'),
    minQty: nonNegativeFloat8Digits,
    maxQty: positiveFloat8Digits,
    stepSize: nonNegativeFloat8Digits,
  })
  .refine(
    ({ minQty, maxQty }) => maxQty > minQty,
    ({ minQty, maxQty }) => ({
      message: `maxQty (${maxQty}) must be greater than minQty (${minQty})`,
      path: ['maxQty'],
    }),
  );
export type MarketLotSizeFilter = z.infer<typeof marketLotSizeFilterSchema>;
