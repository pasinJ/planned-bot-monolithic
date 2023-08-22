import { z } from 'zod';

import { positiveFloat8Digits } from '#shared/common.type.js';

export const marketLotSizeFilterSchema = z
  .object({
    type: z.literal('MARKET_LOT_SIZE'),
    minQty: positiveFloat8Digits,
    maxQty: positiveFloat8Digits,
    stepSize: positiveFloat8Digits,
  })
  .refine(
    ({ minQty, maxQty }) => maxQty > minQty,
    ({ minQty, maxQty }) => ({
      message: `maxQty (${maxQty}) must be greater than minQty (${minQty})`,
      path: ['maxQty'],
    }),
  );
export type MarketLotSizeFilter = z.infer<typeof marketLotSizeFilterSchema>;
