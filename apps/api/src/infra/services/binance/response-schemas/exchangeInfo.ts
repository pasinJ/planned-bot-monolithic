import { z } from 'zod';

export type ExchangeInfoRespFilterSchema = z.infer<typeof exchangeInfoRespFilterSchema>;
const exchangeInfoRespFilterSchema = z.discriminatedUnion('filterType', [
  z.object({
    filterType: z.literal('LOT_SIZE'),
    minQty: z.coerce.number(),
    maxQty: z.coerce.number(),
    stepSize: z.coerce.number(),
  }),
  z.object({
    filterType: z.literal('MARKET_LOT_SIZE'),
    minQty: z.coerce.number(),
    maxQty: z.coerce.number(),
    stepSize: z.coerce.number(),
  }),
  z.object({
    filterType: z.literal('MIN_NOTIONAL'),
    minNotional: z.coerce.number(),
    applyToMarket: z.boolean(),
    avgPriceMins: z.number(),
  }),
  z.object({
    filterType: z.literal('NOTIONAL'),
    minNotional: z.coerce.number(),
    applyMinToMarket: z.boolean(),
    maxNotional: z.coerce.number(),
    applyMaxToMarket: z.boolean(),
    avgPriceMins: z.number(),
  }),
  z.object({
    filterType: z.literal('PRICE_FILTER'),
    minPrice: z.coerce.number(),
    maxPrice: z.coerce.number(),
    tickSize: z.coerce.number(),
  }),
  z.object({ filterType: z.literal('PERCENT_PRICE') }),
  z.object({ filterType: z.literal('PERCENT_PRICE_BY_SIDE') }),
  z.object({ filterType: z.literal('ICEBERG_PARTS') }),
  z.object({ filterType: z.literal('MAX_NUM_ORDERS') }),
  z.object({ filterType: z.literal('MAX_NUM_ALGO_ORDERS') }),
  z.object({ filterType: z.literal('MAX_NUM_ICEBERG_ORDERS') }),
  z.object({ filterType: z.literal('MAX_POSITION') }),
  z.object({ filterType: z.literal('TRAILING_DELTA') }),
]);
export type ExchangeInfoResp = z.infer<typeof exchangeInfoRespSchema>;
export const exchangeInfoRespSchema = z.object({
  timezone: z.string(),
  serverTime: z.number(),
  rateLimits: z.array(z.any()),
  exchangeFilters: z.array(z.any()),
  symbols: z.array(
    z.object({
      symbol: z.string(),
      status: z.string(),
      baseAsset: z.string(),
      baseAssetPrecision: z.number(),
      quoteAsset: z.string(),
      quotePrecision: z.number(),
      quoteAssetPrecision: z.number(),
      orderTypes: z.array(z.string()),
      icebergAllowed: z.boolean(),
      ocoAllowed: z.boolean(),
      quoteOrderQtyMarketAllowed: z.boolean(),
      allowTrailingStop: z.boolean(),
      cancelReplaceAllowed: z.boolean(),
      isSpotTradingAllowed: z.boolean(),
      isMarginTradingAllowed: z.boolean(),
      filters: z.array(exchangeInfoRespFilterSchema),
      permissions: z.array(z.string()),
      defaultSelfTradePreventionMode: z.string(),
      allowedSelfTradePreventionModes: z.array(z.string()),
    }),
  ),
});
