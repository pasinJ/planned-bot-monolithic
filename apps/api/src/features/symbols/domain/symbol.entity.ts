import { isBefore, isEqual } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { all, collectBy, equals, length, map, prop } from 'ramda';
import { z } from 'zod';

import { exchangeNameEnum, exchangeNameSchema } from '#features/exchanges/domain/exchange.js';
import { nonEmptyString } from '#shared/common.type.js';
import { CustomError } from '#shared/error.js';
import { SchemaValidationError, parseWithZod } from '#shared/utils/zod.js';

import { LotSizeFilter, lotSizeFilterSchema } from './lotSizeFilter.entity.js';
import { MarketLotSizeFilter, marketLotSizeFilterSchema } from './marketLotSizeFilter.entity.js';
import { MinNotionalFilter, minNotionalFilterSchema } from './minNotionalFilter.entity.js';
import { NotionalFilter, notionalFilterSchema } from './notionalFilter.entity.js';
import { PriceFilter, priceFilterSchema } from './priceFilter.entity.js';

const symbolIdSchema = nonEmptyString.brand('SymbolId');
export type SymbolId = z.infer<typeof symbolIdSchema>;

const symbolNameSchema = nonEmptyString.brand('SymbolName');

const assetSchema = nonEmptyString.brand('Asset');
const assetPrecisionSchema = z.number().nonnegative().int().brand('Precision');

const orderTypeSchema = z.enum([
  'LIMIT',
  'MARKET',
  'STOP_LOSS',
  'STOP_LOSS_LIMIT',
  'TAKE_PROFIT',
  'TAKE_PROFIT_LIMIT',
  'LIMIT_MAKER',
]);
export type OrderType = z.infer<typeof orderTypeSchema>;
const orderTypesSchema = z.array(orderTypeSchema);
export const orderTypeEnum = orderTypeSchema.enum;

const filtersSchema = z.array(
  z.discriminatedUnion('type', [
    lotSizeFilterSchema.innerType(),
    marketLotSizeFilterSchema.innerType(),
    minNotionalFilterSchema,
    notionalFilterSchema,
    priceFilterSchema.innerType(),
  ]),
);
export type SymbolFilters = z.infer<typeof filtersSchema>;

const versionSchema = z.number().nonnegative().int().brand('SymbolVersion');

const timestampSchema = z.date();

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
export type Symbol = z.infer<typeof symbolSchema>;

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
export function createSymbol(data: CreateSymbolData, currentDate: Date): e.Either<CreateSymbolError, Symbol> {
  return pipe(
    parseWithZod(symbolSchema, 'Validating symbol entity schema failed', {
      ...data,
      exchange: exchangeNameEnum.BINANCE,
      version: 0,
      createdAt: currentDate,
      updatedAt: currentDate,
    }),
    e.mapLeft((error) => new CreateSymbolError().causedBy(error)),
  );
}
export class CreateSymbolError extends CustomError<'CREATE_SYMBOL_ENTITY_ERROR', SchemaValidationError>(
  'CREATE_SYMBOL_ENTITY_ERROR',
  'Error happened when try to create a symbol entity',
) {}
