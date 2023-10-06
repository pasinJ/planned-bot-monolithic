import { Decimal } from 'decimal.js';
import e from 'fp-ts/lib/Either.js';
import { append } from 'ramda';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { FilledOrder } from './order.js';

export type Trade = OpeningTrade | ClosedTrade;

export type OpeningTrade = {
  /** Trade ID */
  id: TradeId;
  /** Entry order information */
  entryOrder: FilledOrder & { orderSide: 'ENTRY' };
  /** Quantity of opening asset in current trade */
  tradeQuantity: TradeQuantity;
  /** The maximum possible loss during the trade */
  maxDrawdown: TradeDrawdown;
  /** The maximum possible profit during the trade */
  maxRunup: TradeRunup;
};

export type ClosedTrade = OpeningTrade & {
  /** Exit order information */
  exitOrder: FilledOrder & { orderSide: 'EXIT' };
  /** Realized net return (profit or loss) of this trade <br/>
   * Fee included. <br/>
   * (Losses are expressed as negative values.)
   */
  netReturn: NetReturn;
};

export type TradeId = string & z.BRAND<'TradeId'>;
export type TradeQuantity = number & z.BRAND<'TradeQuantity'>;
export type TradeDrawdown = number & z.BRAND<'TradeDrawdown'>;
export type TradeRunup = number & z.BRAND<'TradeRunup'>;
export type NetReturn = number & z.BRAND<'NetReturn'>;

export function createOpeningTrade(
  tradeId: TradeId,
  filledEntryOrder: FilledOrder & { orderSide: 'ENTRY' },
): OpeningTrade {
  const { quantity, fee } = filledEntryOrder;

  return {
    id: tradeId,
    entryOrder: filledEntryOrder,
    tradeQuantity: new Decimal(quantity).minus(fee.amount).toNumber() as TradeQuantity,
    maxDrawdown: 0 as TradeDrawdown,
    maxRunup: 0 as TradeRunup,
  };
}

export function closeTrades(
  openingTrades: readonly OpeningTrade[],
  filledExitOrder: FilledOrder & { orderSide: 'EXIT' },
): e.Either<string, DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>> {
  function calculateNetReturn(
    openingTrade: OpeningTrade,
    filledExitOrder: FilledOrder & { orderSide: 'EXIT' },
  ): NetReturn {
    const { entryOrder, tradeQuantity } = openingTrade;
    const { filledPrice: entryPrice, fee: entryFee } = entryOrder;
    const { quantity: exitQuantity, filledPrice: exitPrice, fee: exitFee } = filledExitOrder;

    const proportionalEntryFee = new Decimal(tradeQuantity)
      .times(entryFee.amount)
      .dividedBy(new Decimal(entryOrder.quantity).minus(entryFee.amount));
    const proportionalExitFee = new Decimal(tradeQuantity).times(exitFee.amount).dividedBy(exitQuantity);
    const cost = new Decimal(tradeQuantity)
      .plus(proportionalEntryFee)
      .times(entryPrice)
      .plus(proportionalExitFee);
    const _return = new Decimal(tradeQuantity).times(exitPrice);
    const netReturn = _return.minus(cost);

    return netReturn.toDecimalPlaces(8, Decimal.ROUND_HALF_UP).toNumber() as NetReturn;
  }

  const { remainQuantityToExit, newOpeningTradesList, closedTrades } = openingTrades.reduce(
    (prev, openingTrade) => {
      const { remainQuantityToExit, newOpeningTradesList, closedTrades } = prev;
      const { tradeQuantity } = openingTrade;
      const { quantity: exitQuantity } = filledExitOrder;

      if (remainQuantityToExit === 0) {
        return { ...prev, newOpeningTradesList: append(openingTrade, newOpeningTradesList) };
      }

      if (tradeQuantity > remainQuantityToExit) {
        {
          const openingTradeToClose: OpeningTrade = {
            ...openingTrade,
            tradeQuantity: exitQuantity as TradeQuantity,
          };
          const remainingOpeningTrade: OpeningTrade = {
            ...openingTrade,
            tradeQuantity: new Decimal(tradeQuantity).minus(exitQuantity).toNumber() as TradeQuantity,
          };

          const closedTrade: ClosedTrade = {
            ...openingTradeToClose,
            exitOrder: filledExitOrder,
            netReturn: calculateNetReturn(openingTradeToClose, filledExitOrder),
          };

          return {
            remainQuantityToExit: 0,
            newOpeningTradesList: append(remainingOpeningTrade, newOpeningTradesList),
            closedTrades: append(closedTrade, closedTrades),
          };
        }
      } else {
        const closedTrade: ClosedTrade = {
          ...openingTrade,
          exitOrder: filledExitOrder,
          netReturn: calculateNetReturn(openingTrade, filledExitOrder),
        };

        return {
          ...prev,
          remainQuantityToExit: new Decimal(remainQuantityToExit).minus(tradeQuantity).toNumber(),
          closedTrades: append(closedTrade, closedTrades),
        };
      }
    },
    {
      remainQuantityToExit: filledExitOrder.quantity,
      newOpeningTradesList: [] as OpeningTrade[],
      closedTrades: [] as ClosedTrade[],
    },
  );

  return remainQuantityToExit === 0
    ? e.right({ openingTrades: newOpeningTradesList, closedTrades })
    : e.left('There are not enough opening trades to fulfill the exit order');
}
