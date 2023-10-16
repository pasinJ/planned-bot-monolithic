import { Decimal } from 'decimal.js';
import { z } from 'zod';

import type { AssetPrecisionNumber } from '#SECT/Symbol.js';
import { nonNegativeIntSchema } from '#shared/utils/number.js';
import { nonEmptyStringSchema } from '#shared/utils/string.js';

import { exchangeNameSchema } from './exchange.js';
import { orderTypeSchema } from './order.js';

export type {
  Symbol,
  SymbolName,
  AssetName,
  AssetPrecisionNumber,
  BaseAssetPrecisionNumber,
  QuoteAssetPrecisionNumber,
} from '#SECT/Symbol.js';

const symbolNameSchema = nonEmptyStringSchema.brand('SymbolName');

const assetNameSchema = nonEmptyStringSchema.brand('AssetName');

const assetPrecisionNumberSchema = nonNegativeIntSchema.brand('AssetPrecisionNumber');
const baseAssetPrecisionNumberSchema = assetPrecisionNumberSchema.brand('BaseAssetPrecisionNumber');
const quoteAssetPrecisionNumberSchema = assetPrecisionNumberSchema.brand('QuoteAssetPrecisionNumber');

export const baseSymbolSchema = z.object({
  name: symbolNameSchema,
  exchange: exchangeNameSchema,
  baseAsset: assetNameSchema,
  baseAssetPrecision: baseAssetPrecisionNumberSchema,
  quoteAsset: assetNameSchema,
  quoteAssetPrecision: quoteAssetPrecisionNumberSchema,
  orderTypes: z.array(orderTypeSchema.exclude(['CANCEL'])),
});

export function roundAsset(value: number, precisionNumber: AssetPrecisionNumber) {
  return new Decimal(value).toDecimalPlaces(precisionNumber as number, Decimal.ROUND_HALF_UP).toNumber();
}
