import { z } from 'zod';

import { positiveFloat8Digits } from '#shared/common.type.js';

export const lotSizeFilterSchema = z
  .object({
    type: z.enum(['LOT_SIZE']),
    minQty: positiveFloat8Digits,
    maxQty: positiveFloat8Digits,
    stepSize: positiveFloat8Digits,
  })
  .strict()
  .refine(
    ({ minQty, maxQty }) => maxQty > minQty,
    ({ minQty, maxQty }) => ({
      message: `maxQty (${maxQty}) must be greater than minQty (${minQty})`,
      path: ['maxQty'],
    }),
  );
export type LotSizeFilter = z.infer<typeof lotSizeFilterSchema>;
