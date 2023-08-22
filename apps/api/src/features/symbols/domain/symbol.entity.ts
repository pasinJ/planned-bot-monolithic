import isBefore from 'date-fns/isBefore';
import { pipe } from 'fp-ts/lib/function.js';
import { all, collectBy, equals, length, map, prop } from 'ramda';
import { z } from 'zod';

import { nonEmptyString, nonNegativeInteger } from '#shared/common.type.js';

import { lotSizeFilterSchema } from './lotSizeFilter.entity.js';
import { marketLotSizeFilterSchema } from './marketLotSizeFilter.entity.js';
import { minNotionalFilterSchema } from './minNotionalFilter.entity.js';
import { notionalFilterSchema } from './notionalFilter.entity.js';
import { priceFilterSchema } from './priceFilter.entity.js';

const symbolIdSchema = nonEmptyString.brand('SymbolId');
export type SymbolId = z.infer<typeof symbolIdSchema>;

const symbolNameSchema = nonEmptyString.brand('SymbolName');

const exchangeSchema = z.enum(['BINANCE']);
export const exchangeEnum = exchangeSchema.enum;

const assetSchema = nonEmptyString.brand('Asset');
const assetPrecisionSchema = nonNegativeInteger.brand('Precision');

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
  z.union([
    lotSizeFilterSchema,
    marketLotSizeFilterSchema,
    minNotionalFilterSchema,
    notionalFilterSchema,
    priceFilterSchema,
  ]),
);
export type SymbolFilters = z.infer<typeof filtersSchema>;

const versionSchema = nonNegativeInteger.brand('SymbolVersion');

const timestampSchema = z.date();

export const symbolSchema = z
  .object({
    id: symbolIdSchema,
    name: symbolNameSchema,
    exchange: exchangeSchema,
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
    ({ createdAt, updatedAt }) => isBefore(createdAt, updatedAt),
    ({ createdAt, updatedAt }) => ({
      message: `updatedAt timestamp (${updatedAt.toISOString()}) must be after createdAt timestamp (${createdAt.toISOString()})`,
      path: ['updatedAt'],
    }),
  );
export type Symbol = z.infer<typeof symbolSchema>;
