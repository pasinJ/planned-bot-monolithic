import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { schemaForType } from '#shared/utils/zod';

import { FeeAmount, feeAmountSchema } from './order';

export type NetProfit = number & z.BRAND<'NetProfit'>;
export const netProfitSchema = schemaForType<NetProfit>().with(z.number().brand('NetProfit'));

export type NetLoss = number & z.BRAND<'NetLoss'>;
export const netLossSchema = schemaForType<NetLoss>().with(z.number().brand('NetLoss'));

export type BuyAndHoldReturn = number & z.BRAND<'BuyAndHoldReturn'>;
export const buyAndHoldReturnSchema = schemaForType<BuyAndHoldReturn>().with(
  z.number().brand('BuyAndHoldReturn'),
);

export type ReturnOfInvestment = number & z.BRAND<'ReturnOfInvestment'>;
export const returnOfInvestmentSchema = schemaForType<ReturnOfInvestment>().with(
  z.number().brand('ReturnOfInvestment'),
);

export type TotalTradeVolume = number & z.BRAND<'TotalTradeVolume'>;
export const totalTradeVolumeSchema = schemaForType<TotalTradeVolume>().with(
  z.number().brand('TotalTradeVolume'),
);

type NumOfTotalTrades = number & z.BRAND<'NumOfTotalTrades'>;
export const numOfTotalTradesSchema = schemaForType<NumOfTotalTrades>().with(
  z.number().brand('NumOfTotalTrades'),
);
type NumOfWinningTrades = number & z.BRAND<'NumOfWinningTrades'>;
export const numOfWinningTradesSchema = schemaForType<NumOfWinningTrades>().with(
  z.number().brand('NumOfWinningTrades'),
);
type NumOfLosingTrades = number & z.BRAND<'NumOfLosingTrades'>;
export const numOfLosingTradesSchema = schemaForType<NumOfLosingTrades>().with(
  z.number().brand('NumOfLosingTrades'),
);
type NumOfEvenTrades = number & z.BRAND<'NumOfEvenTrades'>;
export const numOfEvenTradesSchema = schemaForType<NumOfEvenTrades>().with(
  z.number().brand('NumOfEvenTrades'),
);
type WinRate = number & z.BRAND<'WinRate'>;
export const winRateSchema = schemaForType<WinRate>().with(z.number().brand('WinRate'));
type LossRate = number & z.BRAND<'LossRate'>;
export const lossRateSchema = schemaForType<LossRate>().with(z.number().brand('LossRate'));
type EvenRate = number & z.BRAND<'EvenRate'>;
export const evenRateSchema = schemaForType<EvenRate>().with(z.number().brand('EvenRate'));
type AvgProfit = number & z.BRAND<'AvgProfit'>;
export const avgProfitSchema = schemaForType<AvgProfit>().with(z.number().brand('AvgProfit'));
type AvgLoss = number & z.BRAND<'AvgLoss'>;
export const avgLossSchema = schemaForType<AvgLoss>().with(z.number().brand('AvgLoss'));
type LargestProfit = number & z.BRAND<'LargestProfit'>;
export const largestProfitSchema = schemaForType<LargestProfit>().with(z.number().brand('LargestProfit'));
type LargestLoss = number & z.BRAND<'LargestLoss'>;
export const largestLossSchema = schemaForType<LargestLoss>().with(z.number().brand('LargestLoss'));
export type WinLossMetrics = DeepReadonly<{
  numOfTotalTrades: NumOfTotalTrades;
  numOfWinningTrades: NumOfWinningTrades;
  numOfLosingTrades: NumOfLosingTrades;
  numOfEvenTrades: NumOfEvenTrades;
  winRate: WinRate;
  lossRate: LossRate;
  evenRate: EvenRate;
  avgProfit: AvgProfit;
  avgLoss: AvgLoss;
  largestProfit: LargestProfit;
  largestLoss: LargestLoss;
}>;
export const winLossMetricsSchema = schemaForType<WinLossMetrics>().with(
  z
    .object({
      numOfTotalTrades: numOfTotalTradesSchema,
      numOfWinningTrades: numOfWinningTradesSchema,
      numOfLosingTrades: numOfLosingTradesSchema,
      numOfEvenTrades: numOfEvenTradesSchema,
      winRate: winRateSchema,
      lossRate: lossRateSchema,
      evenRate: evenRateSchema,
      avgProfit: avgProfitSchema,
      avgLoss: avgLossSchema,
      largestProfit: largestProfitSchema,
      largestLoss: largestLossSchema,
    })
    .readonly(),
);

export type ProfitFactor = number & z.BRAND<'ProfitFactor'>;
export const profitFactorSchema = schemaForType<ProfitFactor>().with(z.number().brand('ProfitFactor'));

export type MaxEquityDrawdown = number & z.BRAND<'MaxEquityDrawdown'>;
export const maxEquityDrawdownSchema = schemaForType<MaxEquityDrawdown>().with(
  z.number().brand('MaxEquityDrawdown'),
);

export type MaxEquityRunup = number & z.BRAND<'MaxEquityRunup'>;
export const maxEquityRunupSchema = schemaForType<MaxEquityRunup>().with(z.number().brand('MaxEquityRunup'));

export type TotalFees = Readonly<{ inCapitalCurrency: FeeAmount; inAssetCurrency: FeeAmount }>;
export const totalFeesSchema = schemaForType<TotalFees>().with(
  z.object({ inCapitalCurrency: feeAmountSchema, inAssetCurrency: feeAmountSchema }).readonly(),
);
