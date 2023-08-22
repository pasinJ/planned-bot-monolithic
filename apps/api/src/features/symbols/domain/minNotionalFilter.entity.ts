import { z } from 'zod';

import { positiveFloat8Digits } from '#shared/common.type.js';

export const minNotionalFilterSchema = z
  .object({
    type: z.enum(['MIN_NOTIONAL']),
    minNotional: positiveFloat8Digits,
    applyToMarket: z.boolean(),
    avgPriceMins: z.number().int().nonnegative(),
  })
  .strict();
