import { Decimal } from 'decimal.js';
import e from 'fp-ts/lib/Either.js';
import io from 'fp-ts/lib/IO.js';
import { pipe } from 'fp-ts/lib/function.js';
import { append, concat } from 'ramda';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { FilledOrder } from './orders.js';

export type TradesModule = {
  openingTrades: readonly OpeningTrade[]; // Number of market position entries, which were not closed and remain opened.
  closedTrades: readonly ClosedTrade[]; // Number of closed trades for the whole trading interval.
  evenTrades: readonly ClosedTrade[]; // Number of breakeven trades for the whole trading interval.
  lossTrades: readonly ClosedTrade[]; // Number of unprofitable trades for the whole trading interval.
  winTrades: readonly ClosedTrade[]; // Number of profitable trades for the whole trading interval.
};

export type Trade = OpeningTrade | ClosedTrade;

export type OpeningTrade = {
  /** Trade ID */
  id: TradeId;
  /** Entry order information */
  entryOrder: FilledOrder & { orderSide: 'ENTRY' };
  /** Quantity of current trade */
  tradeQuantity: TradeQuantity;
  /** The maximum possible loss during the trade */
  maxDrawdown: TradeDrawdown;
  /** The maximum possible profit during the trade */
  maxRunup: TradeRunup;
};

export type ClosedTrade = OpeningTrade & {
  /** Exit order information */
  exitOrder: FilledOrder & { orderSide: 'EXIT' };
  /** Realized return (profit or loss) of this trade <br/>
   * (Losses are expressed as negative values.)
   */
  return: Return;
};

export type TradeId = string & z.BRAND<'TradeId'>;
export type Return = number & z.BRAND<'Return'>;
export type TradeQuantity = number & z.BRAND<'TradeQuantity'>;
export type TradeDrawdown = number & z.BRAND<'TradeDrawdown'>;
export type TradeRunup = number & z.BRAND<'TradeRunup'>;

export function createOpeningTrade(
  deps: Readonly<{ generateTradeId: io.IO<TradeId> }>,
  filledOrder: FilledOrder & { orderSide: 'ENTRY' },
): io.IO<OpeningTrade> {
  return pipe(
    deps.generateTradeId,
    io.map(
      (id) =>
        ({
          id,
          entryOrder: filledOrder,
          tradeQuantity: new Decimal(filledOrder.quantity).minus(filledOrder.fee.amount).toNumber(),
          maxDrawdown: 0,
          maxRunup: 0,
        }) as OpeningTrade,
    ),
  );
}

export function closeTrades(
  trades: DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>,
  filledOrder: FilledOrder & { orderSide: 'EXIT' },
): e.Either<string, DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>> {
  const { remainQuantityToExit, newOpeningTradesList, closedTrades } = trades.openingTrades.reduce(
    (prev, openingTrade) => {
      const { remainQuantityToExit, newOpeningTradesList, closedTrades } = prev;
      const { tradeQuantity } = openingTrade;
      const { quantity } = filledOrder;

      if (remainQuantityToExit === 0) {
        return { ...prev, newOpeningTradesList: append(openingTrade, newOpeningTradesList) };
      }

      if (tradeQuantity <= remainQuantityToExit) {
        const closedTrade = { ...openingTrade, exitOrder: filledOrder } as ClosedTrade;

        return {
          ...prev,
          remainQuantityToExit: new Decimal(remainQuantityToExit).minus(tradeQuantity).toNumber(),
          closedTrades: append(closedTrade, closedTrades),
        };
      } else {
        const remainingOpeningTrade = {
          ...openingTrade,
          tradeQuantity: new Decimal(tradeQuantity).minus(quantity).toNumber(),
        } as OpeningTrade;

        const closedTrade = {
          ...openingTrade,
          tradeQuantity: quantity,
          exitOrder: filledOrder,
        } as ClosedTrade;

        return {
          remainQuantityToExit: 0,
          newOpeningTradesList: append(remainingOpeningTrade, newOpeningTradesList),
          closedTrades: append(closedTrade, closedTrades),
        };
      }
    },
    {
      remainQuantityToExit: filledOrder.quantity,
      newOpeningTradesList: [] as OpeningTrade[],
      closedTrades: [] as ClosedTrade[],
    },
  );

  return remainQuantityToExit === 0
    ? e.right({
        openingTrades: newOpeningTradesList,
        closedTrades: concat(trades.closedTrades, closedTrades),
      })
    : e.left('There are not enough opening trades to fulfill the exit order');
}
