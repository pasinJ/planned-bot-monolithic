import { Decimal } from 'decimal.js';
import { propEq } from 'ramda';
import { z } from 'zod';

import { isUndefined } from '#shared/utils/general.js';

import { Kline } from './kline.js';
import { FilledOrder } from './order.js';
import { InitialCapital } from './strategy.js';
import { Return } from './strategyExecutorModules/strategy.js';

type BuyAndHoldReturn = number & z.BRAND<'BuyAndHoldReturn'>;
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

type RateOfInvestment = number & z.BRAND<'RateOfInvestment'>;
export function calculateRateOfInvestment(
  initialCapital: InitialCapital,
  netReturn: Return,
): RateOfInvestment {
  return new Decimal(netReturn)
    .times(100)
    .dividedBy(initialCapital)
    .toDecimalPlaces(8, Decimal.ROUND_HALF_UP)
    .toNumber() as RateOfInvestment;
}

type TotalTradeVolume = number & z.BRAND<'TotalTradeVolume'>;
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
