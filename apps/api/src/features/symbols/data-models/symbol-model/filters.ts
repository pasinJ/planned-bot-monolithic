import { z } from 'zod';

import { nonNegativeFloat8Digits, positiveFloat8Digits } from '#shared/utils/zod.schema.js';

export type LotSizeFilter = z.infer<typeof lotSizeFilterSchema>;
export const lotSizeFilterSchema = z
  .object({
    type: z.literal('LOT_SIZE'),
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

export type MinNotionalFilter = z.infer<typeof minNotionalFilterSchema>;
export const minNotionalFilterSchema = z
  .object({
    type: z.literal('MIN_NOTIONAL'),
    minNotional: positiveFloat8Digits,
    applyToMarket: z.boolean(),
    avgPriceMins: z.number().int().nonnegative(),
  })
  .strict();

export type NotionalFilter = z.infer<typeof notionalFilterSchema>;
export const notionalFilterSchema = z
  .object({
    type: z.literal('NOTIONAL'),
    minNotional: positiveFloat8Digits,
    applyMinToMarket: z.boolean(),
    maxNotional: positiveFloat8Digits,
    applyMaxToMarket: z.boolean(),
    avgPriceMins: z.number().int().nonnegative(),
  })
  .strict();

export type PriceFilter = z.infer<typeof priceFilterSchema>;
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
