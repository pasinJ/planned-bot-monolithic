import { Decimal } from 'decimal.js';
import e from 'fp-ts/lib/Either.js';
import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { nanoid } from 'nanoid';
import { append, dissoc, max, min } from 'ramda';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { Price } from './kline.js';
import { FeeAmount, FilledOrder, OrderQuantity } from './order.js';

export type Trade = OpeningTrade | ClosedTrade;

export type OpeningTrade = {
  /** Trade ID */
  id: TradeId;
  /** Entry order information */
  entryOrder: Extract<FilledOrder, { orderSide: 'ENTRY' }>;
  /** Quantity of opening asset in current trade */
  tradeQuantity: TradeQuantity;
  /** The maximum possible loss during the trade <br/>
   * Before fee deduction.
   */
  maxDrawdown: TradeDrawdown;
  /** Maximum price since the trade was opened */
  maxPrice: Price;
  /** The maximum possible profit during the trade <br/>
   * Before fee deduction.
   */
  maxRunup: TradeRunup;
  /** Minimum price since the trade was opened */
  minPrice: Price;
  /** Current unrealized return (profit or loss) of this trade in capital currency <br/>
   * Before fee deduction. Losses are expressed as negative values.
   */
  unrealizedReturn: UnrealizedReturn;
};

export type ClosedTrade = Omit<OpeningTrade, 'unrealizedReturn'> & {
  /** Exit order information */
  exitOrder: FilledOrder & { orderSide: 'EXIT' };
  /** Realized net return (profit or loss) of this trade in capital currency <br/>
   * After entry and exit fees deduction. Losses are expressed as negative values.
   */
  netReturn: NetReturn;
};

export type TradeId = string & z.BRAND<'TradeId'>;
/** Trade quantity must be positive and less than or equal to <entry quantity> - <entry fee> */
export type TradeQuantity = z.infer<typeof tradeQuantitySchema>;
const tradeQuantitySchema = z.number().positive().brand('TradeQuantity');
/** Trade drawdown must be zero or negative and less than or equal to unrealized return and net return */
export type TradeDrawdown = z.infer<typeof tradeDrawdownSchema>;
const tradeDrawdownSchema = z.number().nonpositive().brand('TradeDrawdown');
/** Trade run-up must be zero or positive and greater than or equal to unrealized return and net return */
export type TradeRunup = z.infer<typeof tradeRunupSchema>;
const tradeRunupSchema = z.number().nonnegative().brand('TradeRunup');
export type UnrealizedReturn = z.infer<typeof unrealizedReturnSchema>;
const unrealizedReturnSchema = z.number().brand('UnrealizedReturn');
export type NetReturn = z.infer<typeof netReturnSchema>;
const netReturnSchema = z.number().brand('NetReturn');

export function generateTradeId(): TradeId {
  return nanoid() as TradeId;
}

export function createFullOpeningTrade(
  tradeId: TradeId,
  entryOrder: Extract<FilledOrder, { orderSide: 'ENTRY' }>,
): OpeningTrade {
  const { quantity, fee, filledPrice } = entryOrder;

  const tradeQuantity = new Decimal(quantity).minus(fee.amount).toNumber() as TradeQuantity;
  const unrealizedReturn = calculateUnrealizedReturns(entryOrder, tradeQuantity, entryOrder.filledPrice);

  return {
    id: tradeId,
    entryOrder: entryOrder,
    tradeQuantity,
    maxDrawdown: 0 as TradeDrawdown,
    maxPrice: filledPrice,
    maxRunup: 0 as TradeRunup,
    minPrice: filledPrice,
    unrealizedReturn,
  };
}

export function createPartialOpeningTrade(
  tradeId: TradeId,
  partialTradeQuantity: number,
  openingTrade: OpeningTrade,
): e.Either<string, OpeningTrade> {
  const { tradeQuantity: fullTradeQuantity, entryOrder, minPrice, maxPrice } = openingTrade;

  if (partialTradeQuantity <= 0) return e.left('trade quantity must be greater than 0');
  else if (partialTradeQuantity > fullTradeQuantity)
    return e.left('Nwe trade quantity must be less than or equal to opening trade quantity');

  const newTradeQuantity = partialTradeQuantity as TradeQuantity;

  const maxDrawdown = calculateDrawdown({ tradeQuantity: newTradeQuantity, entryOrder, minPrice });
  const maxRunup = calculateRunup({ tradeQuantity: newTradeQuantity, entryOrder, maxPrice });
  const unrealizedReturn = calculateUnrealizedReturns(entryOrder, newTradeQuantity, entryOrder.filledPrice);

  return e.right({
    ...openingTrade,
    id: tradeId,
    tradeQuantity: newTradeQuantity,
    maxDrawdown,
    maxRunup,
    unrealizedReturn,
  });
}

function calculateUnrealizedReturns(
  entryOrder: Extract<FilledOrder, { orderSide: 'ENTRY' }>,
  tradeQuantity: TradeQuantity,
  currentPrice: Price,
): UnrealizedReturn {
  const { filledPrice } = entryOrder;

  const cost = new Decimal(tradeQuantity).times(filledPrice);
  const currentValue = new Decimal(tradeQuantity).times(currentPrice);

  return currentValue.minus(cost).toDecimalPlaces(8, Decimal.ROUND_HALF_UP).toNumber() as UnrealizedReturn;
}

export function closeTrades(
  { generateTradeId }: { generateTradeId: io.IO<TradeId> },
  openingTrades: readonly OpeningTrade[],
  exitOrder: Extract<FilledOrder, { orderSide: 'EXIT' }>,
): ioe.IOEither<string, DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>> {
  const passthroughCurrentOpeningTrade: ReduceCallbackFn = (openingTrade, prev) => {
    return ioe.right({ ...prev, newOpeningTrades: append(openingTrade, prev.newOpeningTrades) });
  };
  const fullyCloseCurrentOpeningTrade: ReduceCallbackFn = (openingTrade, prev) => {
    const { remainQuantityToExit, newOpeningTrades, closedTrades } = prev;
    const { tradeQuantity } = openingTrade;

    return ioe.right({
      remainQuantityToExit: new Decimal(remainQuantityToExit)
        .minus(tradeQuantity)
        .toNumber() as OrderQuantity,
      newOpeningTrades,
      closedTrades: append(createClosedTrade(openingTrade, exitOrder), closedTrades),
    });
  };
  const partialCloseCurrentOpeningTrade: ReduceCallbackFn = (openingTrade, prev) => {
    const { remainQuantityToExit, newOpeningTrades, closedTrades } = prev;
    const { tradeQuantity } = openingTrade;

    const remainOpeningTrade = pipe(
      ioe.Do,
      ioe.bind('tradeId', () => ioe.fromIO(generateTradeId)),
      ioe.let(
        'remainOpenQuantity',
        () => new Decimal(tradeQuantity).minus(remainQuantityToExit).toNumber() as OrderQuantity,
      ),
      ioe.chainEitherK(({ tradeId, remainOpenQuantity }) =>
        createPartialOpeningTrade(tradeId, remainOpenQuantity, openingTrade),
      ),
    );
    const closedTrade = pipe(
      ioe.fromIO(generateTradeId),
      ioe.chainEitherK((tradeId) => createPartialOpeningTrade(tradeId, remainQuantityToExit, openingTrade)),
      ioe.map((openingTradeToBeClosed) => createClosedTrade(openingTradeToBeClosed, exitOrder)),
    );

    return pipe(
      ioe.Do,
      ioe.bind('remainOpeningTrade', () => remainOpeningTrade),
      ioe.bind('closedTrade', () => closedTrade),
      ioe.map(({ remainOpeningTrade, closedTrade }) => ({
        remainQuantityToExit: 0 as OrderQuantity,
        newOpeningTrades: append(remainOpeningTrade, newOpeningTrades),
        closedTrades: append(closedTrade, closedTrades),
      })),
    );
  };

  type ReduceResult = {
    remainQuantityToExit: OrderQuantity;
    newOpeningTrades: OpeningTrade[];
    closedTrades: ClosedTrade[];
  };
  type ReduceCallbackFn = (
    openingTrade: OpeningTrade,
    prev: ReduceResult,
  ) => ioe.IOEither<string, ReduceResult>;
  const initial: ReduceResult = {
    remainQuantityToExit: exitOrder.quantity,
    newOpeningTrades: [],
    closedTrades: [],
  };

  return pipe(
    openingTrades.reduce(
      (prev, openingTrade) =>
        pipe(
          prev,
          ioe.chain((prev) =>
            prev.remainQuantityToExit === 0
              ? passthroughCurrentOpeningTrade(openingTrade, prev)
              : openingTrade.tradeQuantity <= prev.remainQuantityToExit
              ? fullyCloseCurrentOpeningTrade(openingTrade, prev)
              : partialCloseCurrentOpeningTrade(openingTrade, prev),
          ),
        ),
      ioe.of<string, ReduceResult>(initial),
    ),
    ioe.chainEitherK(({ remainQuantityToExit, newOpeningTrades, closedTrades }) =>
      remainQuantityToExit === 0
        ? e.right({ openingTrades: newOpeningTrades, closedTrades })
        : e.left('There are not enough opening trades to fulfill the exit order'),
    ),
  );
}

function createClosedTrade(
  openingTrade: OpeningTrade,
  exitOrder: Extract<FilledOrder, { orderSide: 'EXIT' }>,
): ClosedTrade {
  const { maxPrice, minPrice, tradeQuantity, entryOrder } = openingTrade;

  const updatedPrice = {
    ...dissoc('unrealizedReturn', openingTrade),
    maxPrice: max(maxPrice, exitOrder.filledPrice),
    minPrice: min(minPrice, exitOrder.filledPrice),
  };
  const maxDrawdown = calculateDrawdown(updatedPrice);
  const maxRunup = calculateRunup(updatedPrice);
  const netReturn = calculateNetReturn({ tradeQuantity, entryOrder, exitOrder });
  return { ...updatedPrice, maxDrawdown, maxRunup, exitOrder, netReturn };
}

function calculateNetReturn({
  tradeQuantity,
  entryOrder,
  exitOrder,
}: {
  tradeQuantity: TradeQuantity;
  entryOrder: Extract<FilledOrder, { orderSide: 'ENTRY' }>;
  exitOrder: Extract<FilledOrder, { orderSide: 'EXIT' }>;
}): NetReturn {
  const { filledPrice: entryPrice } = entryOrder;
  const { filledPrice: exitPrice } = exitOrder;

  const proportionalEntryFee = calculateProportionalEntryFee({ tradeQuantity, entryOrder });
  const proportionalExitFee = calculateProportionalExitFee({ tradeQuantity, exitOrder });
  const cost = new Decimal(tradeQuantity)
    .plus(proportionalEntryFee)
    .times(entryPrice)
    .plus(proportionalExitFee);
  const _return = new Decimal(tradeQuantity).times(exitPrice);
  const netReturn = _return.minus(cost);

  return netReturn.toDecimalPlaces(8, Decimal.ROUND_HALF_UP).toNumber() as NetReturn;
}

function calculateProportionalEntryFee({
  tradeQuantity,
  entryOrder,
}: {
  tradeQuantity: TradeQuantity;
  entryOrder: Extract<FilledOrder, { orderSide: 'ENTRY' }>;
}): FeeAmount {
  const ratio = new Decimal(tradeQuantity).dividedBy(
    new Decimal(entryOrder.quantity).minus(entryOrder.fee.amount),
  );

  return new Decimal(entryOrder.fee.amount)
    .times(ratio)
    .toDecimalPlaces(8, Decimal.ROUND_HALF_UP)
    .toNumber() as FeeAmount;
}

function calculateProportionalExitFee({
  tradeQuantity,
  exitOrder,
}: {
  tradeQuantity: TradeQuantity;
  exitOrder: Extract<FilledOrder, { orderSide: 'EXIT' }>;
}): FeeAmount {
  const ratio = new Decimal(tradeQuantity).dividedBy(exitOrder.quantity);

  return new Decimal(exitOrder.fee.amount)
    .times(ratio)
    .toDecimalPlaces(8, Decimal.ROUND_HALF_UP)
    .toNumber() as FeeAmount;
}

// function assignMinMaxPrice<T extends OpeningTrade>(trade: T, currentKline: Kline): T {
//   const { maxPrice, minPrice } = trade;
//   const { high, low } = currentKline;

//   return { ...trade, maxPrice: max(maxPrice, high), minPrice: min(minPrice, low) };
// }

function calculateDrawdown({
  tradeQuantity,
  entryOrder,
  minPrice,
}: {
  tradeQuantity: TradeQuantity;
  entryOrder: Extract<FilledOrder, { orderSide: 'ENTRY' }>;
  minPrice: Price;
}): TradeDrawdown {
  const cost = new Decimal(tradeQuantity).times(entryOrder.filledPrice);
  const lowestPoint = new Decimal(tradeQuantity).times(minPrice);
  const maxDrawdown = lowestPoint.minus(cost).toDecimalPlaces(8, Decimal.ROUND_HALF_UP).toNumber();

  return min(0, maxDrawdown) as TradeDrawdown;
}

function calculateRunup({
  tradeQuantity,
  entryOrder,
  maxPrice,
}: {
  tradeQuantity: TradeQuantity;
  entryOrder: Extract<FilledOrder, { orderSide: 'ENTRY' }>;
  maxPrice: Price;
}): TradeRunup {
  const cost = new Decimal(tradeQuantity).times(entryOrder.filledPrice);
  const highestPoint = new Decimal(tradeQuantity).times(maxPrice);
  const maxRunup = highestPoint.minus(cost).toDecimalPlaces(8, Decimal.ROUND_HALF_UP).toNumber();

  return max(0, maxRunup) as TradeRunup;
}
