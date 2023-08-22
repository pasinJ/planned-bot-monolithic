import { z } from 'zod';

import { positiveFloat8Digits } from '#shared/common.type.js';

export const notionalFilterSchema = z
  .object({
    type: z.enum(['NOTIONAL']),
    minNotional: positiveFloat8Digits,
    applyMinToMarket: z.boolean(),
    maxNotional: positiveFloat8Digits,
    applyMaxToMarket: z.boolean(),
    avgPriceMins: z.number().int().nonnegative(),
  })
  .strict();
export type NotionalFilter = z.infer<typeof notionalFilterSchema>;
