import { isAfter, isBefore } from 'date-fns';
import Decimal from 'decimal.js';
import { append } from 'ramda';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { Kline } from '#features/klines/kline';
import { ValidDate, isAfterOrEqual, isBeforeOrEqual } from '#shared/utils/date';
import { DurationString } from '#shared/utils/string';
import { schemaForType } from '#shared/utils/zod';

import { InitialCapital } from './btStrategy';
import { FeeAmount, FilledOrder, feeAmountSchema } from './order';
import { NetReturn } from './trade';

export type PerformanceMetrics = DeepReadonly<{
  netReturn: NetReturn;
  netProfit: NetProfit;
  netLoss: NetLoss;
  maxDrawdown: MaxEquityDrawdown;
  maxRunup: MaxEquityRunup;
  returnOfInvestment: ReturnOfInvestment;
  profitFactor: ProfitFactor;
  totalTradeVolume: TotalTradeVolume;
  totalFees: TotalFees;
  backtestDuration: DurationString;
  winLossMetrics: WinLossMetrics;
}>;

export type NetProfit = number & z.BRAND<'NetProfit'>;
export const netProfitSchema = schemaForType<NetProfit>().with(z.number().brand('NetProfit'));

export type NetLoss = number & z.BRAND<'NetLoss'>;
export const netLossSchema = schemaForType<NetLoss>().with(z.number().brand('NetLoss'));

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

export type EquityHistory = { time: ValidDate; value: number }[];
export function createEquityHistory(
  initialCapital: InitialCapital,
  filledOrders: readonly FilledOrder[],
  klines: readonly Kline[],
): EquityHistory {
  const { equityHistory } = klines.reduce(
    (prev, kline) => {
      const { holdingAsset, capital, remainOrders } = prev.remainOrders.reduce(
        (prev, order) => {
          if (
            isBefore(order.filledAt, kline.openTimestamp) ||
            isAfter(order.filledAt, kline.closeTimestamp)
          ) {
            return { ...prev, remainOrders: append(order, prev.remainOrders) };
          } else if (order.orderSide === 'ENTRY') {
            const holdingAsset = prev.holdingAsset.plus(new Decimal(order.quantity).minus(order.fee.amount));
            const capital = prev.capital.minus(new Decimal(order.quantity).times(order.filledPrice));

            return { ...prev, holdingAsset, capital };
          } else {
            const holdingAsset = prev.holdingAsset.minus(new Decimal(order.quantity));
            const capital = prev.capital.plus(
              new Decimal(order.quantity).times(order.filledPrice).minus(order.fee.amount),
            );

            return { ...prev, holdingAsset, capital };
          }
        },
        { holdingAsset: prev.holdingAsset, capital: prev.capital, remainOrders: [] as FilledOrder[] },
      );

      const equity = capital.plus(holdingAsset.times(kline.close)).toNumber();

      return {
        remainOrders,
        equityHistory: append({ time: kline.closeTimestamp, value: equity }, prev.equityHistory),
        capital,
        holdingAsset,
      };
    },
    {
      remainOrders: filledOrders,
      equityHistory: [] as EquityHistory,
      capital: new Decimal(initialCapital),
      holdingAsset: new Decimal(0),
    },
  );

  return equityHistory;
}

export type BuyAndHoldHistory = { time: ValidDate; value: number }[];
export function createBuyAndHoldHistory(
  initialCapital: InitialCapital,
  filledOrders: readonly FilledOrder[],
  klines: readonly Kline[],
) {
  const firstEntryOrder = filledOrders.find((order) => order.orderSide === 'ENTRY');

  const { buyAndHoldHistory } = klines.reduce(
    (prev, kline) => {
      if (
        prev.holdingAsset.equals(0) &&
        firstEntryOrder &&
        isAfterOrEqual(firstEntryOrder.filledAt, kline.openTimestamp) &&
        isBeforeOrEqual(firstEntryOrder.filledAt, kline.closeTimestamp)
      ) {
        const feeRate = new Decimal(firstEntryOrder.fee.amount).dividedBy(firstEntryOrder.quantity);
        const allInQuantity = new Decimal(initialCapital).dividedBy(firstEntryOrder.filledPrice);
        const allInFee = allInQuantity.times(feeRate);
        const holdingAsset = allInQuantity.minus(allInFee);
        const buyAndHoldEquity = holdingAsset.times(kline.close).toNumber();

        return {
          holdingAsset: allInQuantity.minus(allInFee),
          buyAndHoldHistory: append(
            { time: kline.closeTimestamp, value: buyAndHoldEquity },
            prev.buyAndHoldHistory,
          ),
        };
      } else if (prev.holdingAsset.equals(0)) {
        return {
          ...prev,
          buyAndHoldHistory: append(
            { time: kline.closeTimestamp, value: initialCapital },
            prev.buyAndHoldHistory,
          ),
        };
      } else {
        const buyAndHoldEquity = prev.holdingAsset.times(kline.close).toNumber();
        return {
          ...prev,
          buyAndHoldHistory: append(
            { time: kline.closeTimestamp, value: buyAndHoldEquity },
            prev.buyAndHoldHistory,
          ),
        };
      }
    },
    { holdingAsset: new Decimal(0), buyAndHoldHistory: [] as BuyAndHoldHistory },
  );

  return buyAndHoldHistory;
}
