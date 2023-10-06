import { Decimal } from 'decimal.js';
import { z } from 'zod';

import { nonNegativeIntSchema } from '#shared/utils/number.js';
import { nonEmptyStringSchema } from '#shared/utils/string.js';

import type { BnbSymbol } from './bnbSymbol.js';
import { exchangeNameSchema } from './exchange.js';
import { orderTypeSchema } from './order.js';

export type Symbol = BnbSymbol;

export type SymbolName = z.infer<typeof symbolNameSchema>;
const symbolNameSchema = nonEmptyStringSchema.brand('SymbolName');

export type AssetName = z.infer<typeof assetNameSchema>;
const assetNameSchema = nonEmptyStringSchema.brand('AssetName');

export type AssetPrecisionNumber = z.infer<typeof assetPrecisionNumberSchema>;
export type BaseAssetPrecisionNumber = z.infer<typeof baseAssetPrecisionNumberSchema>;
export type QuoteAssetPrecisionNumber = z.infer<typeof quoteAssetPrecisionNumberSchema>;
const assetPrecisionNumberSchema = nonNegativeIntSchema.brand('AssetPrecisionNumber');
const baseAssetPrecisionNumberSchema = assetPrecisionNumberSchema.brand('AssetPrecisionNumber');
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
  return new Decimal(value).toDecimalPlaces(precisionNumber, Decimal.ROUND_HALF_UP).toNumber();
}
