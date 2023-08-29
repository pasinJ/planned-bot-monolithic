import { z } from 'zod';

import { exchangeSchema } from '#features/shared/domain/exchange';
import { nonEmptyString } from '#utils/common.type';

export const symbolSchema = z
  .object({
    name: nonEmptyString,
    exchange: exchangeSchema,
    baseAsset: nonEmptyString,
    quoteAsset: nonEmptyString,
  })
  .strict()
  .refine((obj) => obj.name.includes(obj.baseAsset), {
    message: 'baseAsset property must be substring of symbol name',
    path: ['baseAsset'],
  })
  .refine((obj) => obj.name.includes(obj.quoteAsset), {
    message: 'quoteAsset property must be substring of symbol name',
    path: ['quoteAsset'],
  });
export type Symbol = z.infer<typeof symbolSchema>;
