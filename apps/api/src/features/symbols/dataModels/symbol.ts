import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { all, collectBy, equals, length, map, prop } from 'ramda';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { ExchangeName, exchangeNameSchema } from '#features/shared/domain/exchange.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { nonNegativeFloat8DigitsSchema, positiveFloat8DigitsSchema } from '#shared/utils/number.js';
import { nonEmptyStringSchema } from '#shared/utils/string.js';
import { validateWithZod } from '#shared/utils/zod.js';

export type SymbolModel = DeepReadonly<{
  name: SymbolName;
  exchange: ExchangeName;
  baseAsset: AssetName;
  baseAssetPrecision: AssetPrecisionNumber;
  quoteAsset: AssetName;
  quoteAssetPrecision: AssetPrecisionNumber;
  orderTypes: OrderType[];
  filters: (LotSizeFilter | MarketLotSizeFilter | MinNotionalFilter | NotionalFilter | PriceFilter)[];
}>;

export type SymbolName = z.infer<typeof symbolNameSchema>;
const symbolNameSchema = nonEmptyStringSchema.brand('SymbolName');

export type AssetName = z.infer<typeof assetNameSchema>;
const assetNameSchema = nonEmptyStringSchema.brand('AssetName');

export type AssetPrecisionNumber = z.infer<typeof assetPrecisionNumberSchema>;
const assetPrecisionNumberSchema = z.number().nonnegative().int().brand('AssetPrecisionNumber');

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
    avgPriceMins: z.number().int().nonnegative(),
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
    avgPriceMins: z.number().int().nonnegative(),
  })
  .strict();

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

export type CreateSymbolModelError = GeneralError<'CreateSymbolModelError'>;
export function createSymbolModel(data: {
  name: string;
  exchange: ExchangeName;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quoteAssetPrecision: number;
  orderTypes: readonly string[];
  filters: readonly unknown[];
}): e.Either<CreateSymbolModelError, SymbolModel> {
  const symbolModelSchema = z
    .object({
      name: symbolNameSchema,
      exchange: exchangeNameSchema,
      baseAsset: assetNameSchema,
      baseAssetPrecision: assetPrecisionNumberSchema,
      quoteAsset: assetNameSchema,
      quoteAssetPrecision: assetPrecisionNumberSchema,
      orderTypes: z.array(orderTypeSchema),
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
