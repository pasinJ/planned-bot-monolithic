import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { all, collectBy, equals, length, map, prop } from 'ramda';
import { z } from 'zod';

import { exchangeNameSchema } from '#features/shared/domain/exchangeName.js';
import { symbolNameSchema } from '#features/shared/domain/symbolName.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { validateWithZod } from '#shared/utils/zod.js';
import { nonEmptyString, nonNegativeFloat8Digits, positiveFloat8Digits } from '#shared/utils/zod.schema.js';

const assetSchema = nonEmptyString.brand('Asset');
const assetPrecisionSchema = z.number().nonnegative().int().brand('Precision');

export type OrderType = z.infer<typeof orderTypeSchema>;
const orderTypeSchema = z.enum([
  'LIMIT',
  'MARKET',
  'STOP_LOSS',
  'STOP_LOSS_LIMIT',
  'TAKE_PROFIT',
  'TAKE_PROFIT_LIMIT',
  'LIMIT_MAKER',
]);
export const orderTypeEnum = orderTypeSchema.enum;
export const orderTypeList = orderTypeSchema.options;
const orderTypesSchema = z.array(orderTypeSchema);

export type LotSizeFilter = z.infer<typeof lotSizeFilterSchema>;
const lotSizeFilterSchema = z
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
const marketLotSizeFilterSchema = z
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
const minNotionalFilterSchema = z
  .object({
    type: z.literal('MIN_NOTIONAL'),
    minNotional: positiveFloat8Digits,
    applyToMarket: z.boolean(),
    avgPriceMins: z.number().int().nonnegative(),
  })
  .strict();

export type NotionalFilter = z.infer<typeof notionalFilterSchema>;
const notionalFilterSchema = z
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
const priceFilterSchema = z
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

export type SymbolFilters = z.infer<typeof filtersSchema>;
const filtersSchema = z.array(
  z.union([
    lotSizeFilterSchema,
    marketLotSizeFilterSchema,
    minNotionalFilterSchema,
    notionalFilterSchema,
    priceFilterSchema,
  ]),
);

export type SymbolModel = z.infer<typeof symbolModelSchema>;
const symbolModelSchema = z
  .object({
    name: symbolNameSchema,
    exchange: exchangeNameSchema,
    baseAsset: assetSchema,
    baseAssetPrecision: assetPrecisionSchema,
    quoteAsset: assetSchema,
    quoteAssetPrecision: assetPrecisionSchema,
    orderTypes: orderTypesSchema,
    filters: filtersSchema,
  })
  .strict()
  .refine(({ filters }) => pipe(collectBy(prop('type'), filters), map(length), all(equals(1))), {
    message: `filters must not include duplicated filter type`,
    path: ['filters'],
  });

export type CreateSymbolModelError = GeneralError<'CreateSymbolModelError'>;
export function createSymbolModel(data: {
  name: string;
  exchange: string;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quoteAssetPrecision: number;
  orderTypes: string[];
  filters: unknown[];
}): e.Either<CreateSymbolModelError, SymbolModel> {
  return pipe(
    validateWithZod(symbolModelSchema, 'Validating symbol model schema failed', data),
    e.mapLeft((error) =>
      createGeneralError(
        'CreateSymbolModelError',
        'Creating a new symbol model failed because the given data is invalid',
        error,
      ),
    ),
  );
}
