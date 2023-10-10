import { z } from 'zod';

import { nonNegativeFloat8DigitsSchema, nonNegativePercentage8DigitsSchema } from '#shared/utils/number.js';
import { nonEmptyStringSchema } from '#shared/utils/string.js';

import type { AssetName, Symbol } from './symbol.js';

export type StrategyName = z.infer<typeof strategyNameSchema>;
export const strategyNameSchema = nonEmptyStringSchema.brand('StrategyName');

export type InitialCapital = z.infer<typeof initialCapitalSchema>;
export const initialCapitalSchema = nonNegativeFloat8DigitsSchema.brand('InitialCapital');

export type FeeRate = z.infer<typeof feeRateSchema>;
const feeRateSchema = nonNegativePercentage8DigitsSchema.brand('FeeRate');

export type TakerFeeRate = z.infer<typeof takerFeeRateSchema>;
export const takerFeeRateSchema = feeRateSchema.brand('TakerFeeRate');

export type MakerFeeRate = z.infer<typeof makerFeeRateSchema>;
export const makerFeeRateSchema = feeRateSchema.brand('MakerFeeRate');

export type CapitalCurrency = AssetName & z.BRAND<'CapitalCurrency'>;
export type AssetCurrency = AssetName & z.BRAND<'AssetCurrency'>;

export type Language = z.infer<typeof languageSchema>;
export const languageSchema = z.enum(['javascript', 'typescript']);
export const languageEnum = languageSchema.enum;
export const languageList = languageSchema.options;

export type StrategyBody = z.infer<typeof strategyBodySchema>;
export const strategyBodySchema = nonEmptyStringSchema.brand('StrategyBody');

export function mapCapitalCurrencyToAssetCurrency(
  capitalCurrency: CapitalCurrency,
  symbol: Symbol,
): AssetCurrency {
  return (capitalCurrency === symbol.baseAsset ? symbol.quoteAsset : symbol.baseAsset) as AssetCurrency;
}
