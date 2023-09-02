import te from 'fp-ts/lib/TaskEither.js';
import { z } from 'zod';

import { CreateSymbolError, Symbol } from '#features/symbols/domain/symbol.entity.js';
import { HttpError } from '#infra/http/client.type.js';
import { CustomError, ExternalError } from '#shared/error.js';

export type BnbService = {
  getSpotSymbols: te.TaskEither<GetBnbSpotSymbolsError, readonly Symbol[]>;
};

export class CreateBnbServiceError extends CustomError<'CREATE_BNB_SERVICE_ERROR', ExternalError>(
  'CREATE_BNB_SERVICE_ERROR',
  'Error happened when try to create BNB service',
) {}
export class GetBnbSpotSymbolsError extends CustomError<
  'GET_BNB_SPOT_SYMBOLS_ERROR',
  HttpError | CreateSymbolError
>('GET_BNB_SPOT_SYMBOLS_ERROR', 'Error happened when try to get BNB SPOT symbols') {}

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
