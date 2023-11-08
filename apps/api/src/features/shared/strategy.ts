import { z } from 'zod';

import type { AssetCurrency, CapitalCurrency } from '#SECT/Strategy.js';
import { nonNegativeFloat8DigitsSchema, nonNegativePercentage8DigitsSchema } from '#shared/utils/number.js';
import { nonEmptyStringSchema } from '#shared/utils/string.js';

import type { Symbol } from './symbol.js';

export type {
  StrategyName,
  InitialCapital,
  FeeRate,
  TakerFeeRate,
  MakerFeeRate,
  CapitalCurrency,
  AssetCurrency,
} from '#SECT/Strategy.js';

export const strategyNameSchema = nonEmptyStringSchema.brand('StrategyName');

export const initialCapitalSchema = nonNegativeFloat8DigitsSchema.brand('InitialCapital');

const feeRateSchema = nonNegativePercentage8DigitsSchema.brand('FeeRate');

export const takerFeeRateSchema = feeRateSchema.brand('TakerFeeRate');

export const makerFeeRateSchema = feeRateSchema.brand('MakerFeeRate');

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
