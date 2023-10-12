import { Decimal } from 'decimal.js';
import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { all, collectBy, equals, length, map, prop, propEq, uniq } from 'ramda';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { isUndefined } from '#shared/utils/general.js';
import {
  nonNegativeFloat8DigitsSchema,
  nonNegativeIntSchema,
  positiveFloat8DigitsSchema,
} from '#shared/utils/number.js';
import { validateWithZod } from '#shared/utils/zod.js';

import { exchangeNameEnum } from './exchange.js';
import { OrderType } from './order.js';
import { Symbol, baseSymbolSchema, roundAsset } from './symbol.js';

export type BnbOrderType = z.infer<typeof bnbOrderTypeSchema>;
const bnbOrderTypeSchema = z.enum([
  'MARKET',
  'LIMIT',
  'LIMIT_MAKER',
  'STOP_LOSS',
  'STOP_LOSS_LIMIT',
  'TAKE_PROFIT',
  'TAKE_PROFIT_LIMIT',
]);
export const bnbOrderTypeEnum = bnbOrderTypeSchema.enum;
export const bnbOrderTypeList = bnbOrderTypeSchema.options;

export type LotSizeFilter = Readonly<z.infer<typeof lotSizeFilterSchema>>;
const lotSizeFilterSchema = z
  .object({
    type: z.literal('LOT_SIZE'),
    minQty: nonNegativeFloat8DigitsSchema,
    maxQty: positiveFloat8DigitsSchema,
    stepSize: nonNegativeFloat8DigitsSchema,
  })
  .refine(
    ({ minQty, maxQty }) => maxQty > minQty,
    ({ minQty, maxQty }) => ({
      message: `maxQty (${maxQty}) must be greater than minQty (${minQty})`,
      path: ['maxQty'],
    }),
  );

export type MarketLotSizeFilter = Readonly<z.infer<typeof marketLotSizeFilterSchema>>;
const marketLotSizeFilterSchema = z
  .object({
    type: z.literal('MARKET_LOT_SIZE'),
    minQty: nonNegativeFloat8DigitsSchema,
    maxQty: positiveFloat8DigitsSchema,
    stepSize: nonNegativeFloat8DigitsSchema,
  })
  .refine(
    ({ minQty, maxQty }) => maxQty > minQty,
    ({ minQty, maxQty }) => ({
      message: `maxQty (${maxQty}) must be greater than minQty (${minQty})`,
      path: ['maxQty'],
    }),
  );

export type MinNotionalFilter = Readonly<z.infer<typeof minNotionalFilterSchema>>;
const minNotionalFilterSchema = z
  .object({
    type: z.literal('MIN_NOTIONAL'),
    minNotional: nonNegativeFloat8DigitsSchema,
    applyToMarket: z.boolean(),
    avgPriceMins: nonNegativeIntSchema,
  })
  .strict();

export type NotionalFilter = Readonly<z.infer<typeof notionalFilterSchema>>;
const notionalFilterSchema = z
  .object({
    type: z.literal('NOTIONAL'),
    minNotional: nonNegativeFloat8DigitsSchema,
    applyMinToMarket: z.boolean(),
    maxNotional: positiveFloat8DigitsSchema,
    applyMaxToMarket: z.boolean(),
    avgPriceMins: nonNegativeIntSchema,
  })
  .strict()
  .refine(
    ({ minNotional, maxNotional }) => maxNotional > minNotional,
    ({ minNotional, maxNotional }) => ({
      message: `maxNotional (${maxNotional}) must be greater than minNotional (${minNotional})`,
      path: ['maxNotional'],
    }),
  );

export type PriceFilter = Readonly<z.infer<typeof priceFilterSchema>>;
const priceFilterSchema = z
  .object({
    type: z.literal('PRICE_FILTER'),
    minPrice: nonNegativeFloat8DigitsSchema,
    maxPrice: positiveFloat8DigitsSchema,
    tickSize: positiveFloat8DigitsSchema,
  })
  .strict()
  .refine(
    ({ minPrice, maxPrice }) => maxPrice > minPrice,
    ({ minPrice, maxPrice }) => ({
      message: `maxPrice (${maxPrice}) must be greater than minPrice (${minPrice})`,
      path: ['maxPrice'],
    }),
  );

export type BnbSymbol = DeepReadonly<z.infer<typeof bnbSymbolSchema>>;
const bnbSymbolSchema = baseSymbolSchema
  .extend({
    exchange: z.literal(exchangeNameEnum.BINANCE),
    bnbOrderTypes: z.array(bnbOrderTypeSchema).nonempty(),
    filters: z.array(
      z.union([
        lotSizeFilterSchema,
        marketLotSizeFilterSchema,
        minNotionalFilterSchema,
        notionalFilterSchema,
        priceFilterSchema,
      ]),
    ),
  })
  .strict()
  .refine(({ filters }) => pipe(collectBy(prop('type'), filters), map(length), all(equals(1))), {
    message: `filters must not include duplicated filter type`,
    path: ['filters'],
  });

export function createBnbSymbol(data: {
  name: string;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quoteAssetPrecision: number;
  bnbOrderTypes: readonly string[];
  filters: readonly unknown[];
}): e.Either<GeneralError<'CreateSymbolFailed'>, BnbSymbol> {
  function mapBnbOrderTypeToOrderType(bnbOrderType: string): OrderType | undefined {
    return bnbOrderType === 'MARKET'
      ? 'MARKET'
      : bnbOrderType === 'LIMIT' || bnbOrderType === 'LIMIT_MAKER'
      ? 'LIMIT'
      : bnbOrderType === 'STOP_LOSS' || bnbOrderType === 'TAKE_PROFIT'
      ? 'STOP_MARKET'
      : bnbOrderType === 'STOP_LOSS_LIMIT' || bnbOrderType === 'TAKE_PROFIT_LIMIT'
      ? 'STOP_LIMIT'
      : undefined;
  }

  return pipe(
    validateWithZod(bnbSymbolSchema, 'Validating binance symbol schema failed', {
      ...data,
      exchange: exchangeNameEnum.BINANCE,
      orderTypes: uniq(data.bnbOrderTypes.map(mapBnbOrderTypeToOrderType)),
    }),
    e.mapLeft((error) =>
      createGeneralError(
        'CreateSymbolFailed',
        'Creating a new binance symbol failed because the given data is invalid',
        error,
      ),
    ),
  );
}

export function isBnbSymbol(symbol: Symbol): symbol is BnbSymbol {
  return bnbSymbolSchema.safeParse(symbol).success;
}

export function isOrderTypeAllowed(
  orderType: Exclude<OrderType, 'CANCEL'>,
  symbol: Symbol,
): e.Either<string, void> {
  return symbol.orderTypes.includes(orderType)
    ? e.right(undefined)
    : e.left(`${orderType} order type is not allowed`);
}

export function validateWithLotSizeFilter(quantity: number, symbol: BnbSymbol): e.Either<string, void> {
  const lotSizefilter = symbol.filters.find(propEq('LOT_SIZE', 'type')) as LotSizeFilter | undefined;
  const minQuantity = lotSizefilter?.minQty;
  const maxQuantity = lotSizefilter?.maxQty;
  const stepSize = lotSizefilter?.stepSize;

  return quantity <= 0
    ? e.left('Quantity must be greater than 0')
    : minQuantity && quantity < minQuantity
    ? e.left(`Quantity must be greater than or equal to min quantity (${minQuantity})`)
    : maxQuantity && quantity > maxQuantity
    ? e.left(`Quantity must be less than or equal to max quantity (${maxQuantity})`)
    : stepSize && new Decimal(quantity).modulo(stepSize).toNumber() !== 0
    ? e.left(`Quantity must be multiple of step size (${stepSize})`)
    : e.right(undefined);
}

export function validateWithMarketLotSizeFilter(quantity: number, symbol: BnbSymbol): e.Either<string, void> {
  const marketLotSizefilter = symbol.filters.find(propEq('MARKET_LOT_SIZE', 'type')) as
    | MarketLotSizeFilter
    | undefined;
  const minQuantity = marketLotSizefilter?.minQty;
  const maxQuantity = marketLotSizefilter?.maxQty;
  const stepSize = marketLotSizefilter?.stepSize;

  return quantity <= 0
    ? e.left('Quantity must be greater than 0')
    : minQuantity && quantity < minQuantity
    ? e.left(`Quantity must be greater than or equal to min quantity (${minQuantity})`)
    : maxQuantity && quantity > maxQuantity
    ? e.left(`Quantity must be less than or equal to max quantity (${maxQuantity})`)
    : stepSize && new Decimal(quantity).modulo(stepSize).toNumber() !== 0
    ? e.left(`Quantity must be multiple of step size (${stepSize})`)
    : e.right(undefined);
}

export function validateWithMinNotionalFilter(
  quantity: number,
  price: number,
  isMarketOrder: boolean,
  symbol: BnbSymbol,
): e.Either<string, void> {
  const notional = roundAsset(new Decimal(quantity).times(price).toNumber(), symbol.quoteAssetPrecision);
  if (notional <= 0) return e.left('Notional must be more than 0');

  const minNotionalFilter = symbol.filters.find(propEq('MIN_NOTIONAL', 'type')) as
    | MinNotionalFilter
    | undefined;
  if (isUndefined(minNotionalFilter)) return e.right(undefined);

  const shouldSkipValidation =
    isMarketOrder && (!minNotionalFilter.applyToMarket || minNotionalFilter.avgPriceMins !== 0);
  if (shouldSkipValidation) return e.right(undefined);

  return notional < minNotionalFilter.minNotional
    ? e.left(`Notional must greater than or equal to min notional (${minNotionalFilter.minNotional})`)
    : e.right(undefined);
}

export function validateWithNotionalFilter(
  quantity: number,
  price: number,
  isMarketOrder: boolean,
  symbol: BnbSymbol,
): e.Either<string, void> {
  const notional = roundAsset(new Decimal(quantity).times(price).toNumber(), symbol.quoteAssetPrecision);
  if (notional <= 0) return e.left('Notional must be more than 0');

  const notionalFilter = symbol.filters.find(propEq('NOTIONAL', 'type')) as NotionalFilter | undefined;
  if (isUndefined(notionalFilter)) return e.right(undefined);

  const shouldSkipValidation = isMarketOrder && notionalFilter.avgPriceMins !== 0;
  if (shouldSkipValidation) return e.right(undefined);

  const { applyMaxToMarket, applyMinToMarket, minNotional, maxNotional } = notionalFilter;

  return applyMinToMarket && notional < minNotional
    ? e.left(`Notional must be greater than or equal to minNotional (${minNotional})`)
    : applyMaxToMarket && notional > maxNotional
    ? e.left(`Notional must be less than or equal to maxNotional (${maxNotional})`)
    : e.right(undefined);
}

export function validateWithPriceFilter(price: number, symbol: BnbSymbol): e.Either<string, void> {
  const priceFilter = symbol.filters.find(propEq('PRICE_FILTER', 'type')) as PriceFilter | undefined;
  const minPrice = priceFilter?.minPrice;
  const maxPrice = priceFilter?.maxPrice;
  const tickSize = priceFilter?.tickSize;

  return price <= 0
    ? e.left('Price must be greater than 0')
    : minPrice && price < minPrice
    ? e.left(`Price must be greater than or equal to min price (${minPrice})`)
    : maxPrice && price > maxPrice
    ? e.left(`Price must be less than or equal to max price (${maxPrice})`)
    : tickSize && new Decimal(price).modulo(tickSize).toNumber() !== 0
    ? e.left(`Price must be multiple of tick size (${tickSize})`)
    : e.right(undefined);
}
