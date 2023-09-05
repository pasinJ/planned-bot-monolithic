import { isBefore, isEqual } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { all, collectBy, equals, length, map, prop } from 'ramda';
import { z } from 'zod';

import { exchangeNameEnum, exchangeNameSchema } from '#features/exchanges/domain/exchange.js';
import { nonEmptyString } from '#shared/common.type.js';
import { parseWithZod } from '#shared/utils/zod.js';

import { LotSizeFilter, lotSizeFilterSchema } from './lotSizeFilter.entity.js';
import { MarketLotSizeFilter, marketLotSizeFilterSchema } from './marketLotSizeFilter.entity.js';
import { MinNotionalFilter, minNotionalFilterSchema } from './minNotionalFilter.entity.js';
import { NotionalFilter, notionalFilterSchema } from './notionalFilter.entity.js';
import { PriceFilter, priceFilterSchema } from './priceFilter.entity.js';
import { SymbolDomainError, createSymbolDomainError } from './symbol.error.js';

export type SymbolId = z.infer<typeof symbolIdSchema>;
const symbolIdSchema = nonEmptyString.brand('SymbolId');

const symbolNameSchema = nonEmptyString.brand('SymbolName');

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
const orderTypesSchema = z.array(orderTypeSchema);

export type SymbolFilters = z.infer<typeof filtersSchema>;
const filtersSchema = z.array(
  z.discriminatedUnion('type', [
    lotSizeFilterSchema.innerType(),
    marketLotSizeFilterSchema.innerType(),
    minNotionalFilterSchema,
    notionalFilterSchema,
    priceFilterSchema.innerType(),
  ]),
);

const versionSchema = z.number().nonnegative().int().brand('SymbolVersion');

const timestampSchema = z.date();

export type Symbol = z.infer<typeof symbolSchema>;
export const symbolSchema = z
  .object({
    id: symbolIdSchema,
    name: symbolNameSchema,
    exchange: exchangeNameSchema,
    baseAsset: assetSchema,
    baseAssetPrecision: assetPrecisionSchema,
    quoteAsset: assetSchema,
    quoteAssetPrecision: assetPrecisionSchema,
    orderTypes: orderTypesSchema,
    filters: filtersSchema,
    version: versionSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict()
  .refine(({ filters }) => pipe(collectBy(prop('type'), filters), map(length), all(equals(1))), {
    message: `filters must not include duplicated filter type`,
    path: ['filters'],
  })
  .refine(
    ({ createdAt, updatedAt }) => isEqual(createdAt, updatedAt) || isBefore(createdAt, updatedAt),
    ({ createdAt, updatedAt }) => ({
      message: `updatedAt timestamp (${updatedAt.toISOString()}) must be equal or after createdAt timestamp (${createdAt.toISOString()})`,
      path: ['updatedAt'],
    }),
  );

type CreateSymbolData = {
  id: string;
  name: string;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quoteAssetPrecision: number;
  orderTypes: string[];
  filters: (LotSizeFilter | MarketLotSizeFilter | MinNotionalFilter | NotionalFilter | PriceFilter)[];
};
export function createSymbol(
  data: CreateSymbolData,
  currentDate: Date,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
): e.Either<SymbolDomainError<'CreateSymbolError'>, Symbol> {
  const symbolEntity = {
    ...data,
    exchange: exchangeNameEnum.BINANCE,
    version: 0,
    createdAt: currentDate,
    updatedAt: currentDate,
  };

  return pipe(
    parseWithZod(symbolSchema, 'Validating symbol entity schema failed', symbolEntity),
    e.mapLeft((error) =>
      createSymbolDomainError(
        'CreateSymbolError',
        'Creating a new symbol entity failed because the given data is invalid',
        error,
      ),
    ),
  );
}
