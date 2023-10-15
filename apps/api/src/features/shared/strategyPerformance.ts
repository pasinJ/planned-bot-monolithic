import { Decimal } from 'decimal.js';
import { max, min, propEq } from 'ramda';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { isUndefined } from '#shared/utils/general.js';
import { to2DigitDecimalNumber, to8DigitDecimalNumber } from '#shared/utils/number.js';

import { Kline } from './kline.js';
import { FilledOrder } from './order.js';
import { InitialCapital } from './strategy.js';
import { Loss, Profit, Return } from './strategyExecutorModules/strategy.js';
import { ClosedTrade } from './trade.js';

export type BuyAndHoldReturn = number & z.BRAND<'BuyAndHoldReturn'>;
export function calculateBuyAndHoldReturn(
  initialCapital: InitialCapital,
  firstEntryOrder: Extract<FilledOrder, { orderSide: 'ENTRY' }> | undefined,
  lastKline: Kline,
): BuyAndHoldReturn {
  if (isUndefined(firstEntryOrder)) return 0 as BuyAndHoldReturn;

  const feeRate = new Decimal(firstEntryOrder.fee.amount).dividedBy(firstEntryOrder.quantity);
  const allInQuantity = new Decimal(initialCapital).dividedBy(firstEntryOrder.filledPrice);
  const allInFee = allInQuantity.times(feeRate);
  const buyAndHoldReturn = new Decimal(lastKline.close)
    .minus(firstEntryOrder.filledPrice)
    .times(allInQuantity.minus(allInFee))
    .toDecimalPlaces(8, Decimal.ROUND_HALF_UP)
    .toNumber();

  return buyAndHoldReturn as BuyAndHoldReturn;
}

export type ReturnOfInvestment = number & z.BRAND<'ReturnOfInvestment'>;
export function calculateReturnOfInvestment(
  initialCapital: InitialCapital,
  netReturn: Return,
): ReturnOfInvestment {
  return new Decimal(netReturn)
    .times(100)
    .dividedBy(initialCapital)
    .toDecimalPlaces(8, Decimal.ROUND_HALF_UP)
    .toNumber() as ReturnOfInvestment;
}

export type TotalTradeVolume = number & z.BRAND<'TotalTradeVolume'>;
export function getTotalTradeVolume(filledOrders: readonly FilledOrder[]): TotalTradeVolume {
  type FilledEntryOrder = Extract<FilledOrder, { orderSide: 'ENTRY' }>;
  const filledEntryOrders = filledOrders.filter(propEq('ENTRY', 'orderSide')) as FilledEntryOrder[];

  if (filledEntryOrders.length === 0) return 0 as TotalTradeVolume;
  else
    return filledEntryOrders
      .reduce((sum, order) => sum.plus(order.quantity), new Decimal(0))
      .toDecimalPlaces(8, Decimal.ROUND_HALF_UP)
      .toNumber() as TotalTradeVolume;
}

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
type NumOfTotalTrades = number & z.BRAND<'NumOfTotalTrades'>;
type NumOfWinningTrades = number & z.BRAND<'NumOfWinningTrades'>;
type NumOfLosingTrades = number & z.BRAND<'NumOfLosingTrades'>;
type NumOfEvenTrades = number & z.BRAND<'NumOfEvenTrades'>;
type WinRate = number & z.BRAND<'WinRate'>;
type LossRate = number & z.BRAND<'LossRate'>;
type EvenRate = number & z.BRAND<'EvenRate'>;
type AvgProfit = number & z.BRAND<'AvgProfit'>;
type AvgLoss = number & z.BRAND<'AvgLoss'>;
type LargestProfit = number & z.BRAND<'LargestProfit'>;
type LargestLoss = number & z.BRAND<'LargestLoss'>;
export function calculateWinLossMetrics(closedTrades: readonly ClosedTrade[]): WinLossMetrics {
  const {
    numOfTotalTrades,
    numOfWinningTrades,
    numOfLosingTrades,
    numOfEvenTrades,
    totalProfit,
    totalLoss,
    largestProfit,
    largestLoss,
  } = closedTrades.reduce(
    (prev, trade) => {
      if (trade.netReturn > 0) {
        return {
          ...prev,
          numOfTotalTrades: prev.numOfTotalTrades + 1,
          numOfWinningTrades: prev.numOfWinningTrades + 1,
          totalProfit: prev.totalProfit.plus(trade.netReturn),
          largestProfit: max(prev.largestProfit, trade.netReturn),
        };
      } else if (trade.netReturn < 0) {
        return {
          ...prev,
          numOfTotalTrades: prev.numOfTotalTrades + 1,
          numOfLosingTrades: prev.numOfLosingTrades + 1,
          totalLoss: prev.totalLoss.plus(trade.netReturn),
          largestLoss: min(prev.largestLoss, trade.netReturn),
        };
      } else {
        return {
          ...prev,
          numOfTotalTrades: prev.numOfTotalTrades + 1,
          numOfEvenTrades: prev.numOfEvenTrades + 1,
        };
      }
    },
    {
      numOfTotalTrades: 0,
      numOfWinningTrades: 0,
      numOfLosingTrades: 0,
      numOfEvenTrades: 0,
      totalProfit: new Decimal(0),
      totalLoss: new Decimal(0),
      largestProfit: 0,
      largestLoss: 0,
    },
  );

  const winRate = new Decimal(numOfWinningTrades).times(100).dividedBy(numOfTotalTrades);
  const lossRate = new Decimal(numOfLosingTrades).times(100).dividedBy(numOfTotalTrades);
  const evenRate = new Decimal(numOfEvenTrades).times(100).dividedBy(numOfTotalTrades);

  const avgProfit = totalProfit.dividedBy(numOfWinningTrades);
  const avgLoss = totalLoss.dividedBy(numOfLosingTrades);

  return {
    numOfTotalTrades,
    numOfWinningTrades,
    numOfLosingTrades,
    numOfEvenTrades,
    winRate: winRate.isNaN() ? 0 : to2DigitDecimalNumber(winRate),
    lossRate: lossRate.isNaN() ? 0 : to2DigitDecimalNumber(lossRate),
    evenRate: evenRate.isNaN() ? 0 : to2DigitDecimalNumber(evenRate),
    avgProfit: avgProfit.isNaN() ? 0 : to8DigitDecimalNumber(avgProfit),
    avgLoss: avgLoss.isNaN() ? 0 : to8DigitDecimalNumber(avgLoss),
    largestProfit,
    largestLoss,
  } as WinLossMetrics;
}

export type ProfitFactor = number & z.BRAND<'ProfitFactor'>;
export function calculateProfitFactor(netProfit: Profit, netLoss: Loss): ProfitFactor {
  return to2DigitDecimalNumber(new Decimal(netProfit).dividedBy(netLoss)) as ProfitFactor;
}
