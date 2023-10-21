import { z } from 'zod';

import { exchangeNameSchema } from '#features/exchanges/domain/exchange';
import { nonEmptyString } from '#shared/common.type';

export const symbolSchema = z
  .object({
    name: nonEmptyString,
    exchange: exchangeNameSchema,
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

export type SymbolName = string & z.BRAND<'SymbolName'>;
