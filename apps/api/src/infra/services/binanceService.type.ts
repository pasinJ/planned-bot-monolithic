import te from 'fp-ts/lib/TaskEither.js';
import { z } from 'zod';

import { CreateSymbolError, Symbol } from '#features/symbols/domain/symbol.entity.js';
import { HttpError } from '#infra/http/client.type.js';
import { ErrorBase, ExternalError } from '#shared/error.js';

export type BnbService = {
  getSpotSymbols: te.TaskEither<GetBnbSpotSymbolsError, readonly Symbol[]>;
};

export class CreateBnbServiceError extends ErrorBase<'CREATE_BNB_SERVICE_ERROR', ExternalError> {}
export class GetBnbSpotSymbolsError extends ErrorBase<
  'GET_BNB_SPOT_SYMBOLS_ERROR',
  HttpError | CreateSymbolError
> {}

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
