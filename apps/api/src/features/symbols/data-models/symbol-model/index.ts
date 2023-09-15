import { isBefore, isEqual } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { all, collectBy, equals, length, map, prop } from 'ramda';
import { z } from 'zod';

import { exchangeNameSchema } from '#features/exchanges/domain/exchange.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { SchemaValidationError, parseWithZod } from '#shared/utils/zod.js';
import { nonEmptyString } from '#shared/utils/zod.schema.js';

import {
  lotSizeFilterSchema,
  marketLotSizeFilterSchema,
  minNotionalFilterSchema,
  notionalFilterSchema,
  priceFilterSchema,
} from './filters.js';

export type SymbolId = SymbolModel['id'];

export type SymbolName = SymbolModel['name'];
export const symbolNameSchema = nonEmptyString.brand('SymbolName');

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
  z.union([
    lotSizeFilterSchema,
    marketLotSizeFilterSchema,
    minNotionalFilterSchema,
    notionalFilterSchema,
    priceFilterSchema,
  ]),
);

const versionSchema = z.number().nonnegative().int().brand('SymbolVersion');

const timestampSchema = z.date();

export type SymbolModel = z.infer<typeof symbolModelSchema>;
const symbolModelSchema = z
  .object({
    id: nonEmptyString.brand('SymbolId'),
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

export type CreateSymbolModelError = GeneralError<'CreateSymbolError', SchemaValidationError>;
export function createSymbolModel(
  data: {
    id: string;
    name: string;
    baseAsset: string;
    baseAssetPrecision: number;
    quoteAsset: string;
    quoteAssetPrecision: number;
    orderTypes: string[];
    filters: unknown[];
    exchange: string;
  },
  currentDate: Date,
): e.Either<CreateSymbolModelError, SymbolModel> {
  return pipe(
    parseWithZod(symbolModelSchema, 'Validating symbol model schema failed', {
      ...data,
      version: 0,
      createdAt: currentDate,
      updatedAt: currentDate,
    }),
    e.mapLeft((error) =>
      createGeneralError({
        type: 'CreateSymbolError',
        message: 'Creating a new symbol model failed because the given data is invalid',
        cause: error,
      }),
    ),
  );
}
