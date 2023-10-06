import { Decimal } from 'decimal.js';
import e from 'fp-ts/lib/Either.js';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { ExchangeName } from '../exchange.js';
import { CanceledOrder, FeeAmount, FilledOrder, OpeningOrder } from '../order.js';
import {
  AssetCurrency,
  CapitalCurrency,
  InitialCapital,
  MakerFeeRate,
  StrategyName,
  TakerFeeRate,
} from '../strategy.js';
import { Symbol } from '../symbol.js';
import { Timeframe } from '../timeframe.js';

export type StrategyModule = DeepReadonly<{
  /** Name of strategy */
  name: StrategyName;
  /** Name of exchange */
  exchange: ExchangeName;
  /** Symbol information */
  symbol: Symbol;
  /** Timeframe */
  timeframe: Timeframe;
  /** Taker fee rate for MARKET and STOP_MARKET orders */
  takerFeeRate: TakerFeeRate;
  /** Maker fee rate for LIMIT and STOP_LIMIT orders */
  makerFeeRate: MakerFeeRate;

  /** Amount of initial capital in base currency */
  initialCapital: InitialCapital;
  /** Total current amount of capital in base currency */
  totalCapital: TotalCapital;
  /** Amount of capital in base currency that is in opening orders */
  inOrdersCapital: InOrdersCapital;
  /** Amount of available capital in base currency that isn't in opening orders or opening trades */
  availableCapital: AvailableCapital;
  /** Capital currency of strategy. This can be either base asset or quote asset of symbol */
  capitalCurrency: CapitalCurrency;

  /** Total amount of holding asset in asset currency */
  totalAssetQuantity: TotalAssetQuantity;
  /** Amount of holding asset in asset currency that is in opening orders */
  inOrdersAssetQuantity: InOrdersAssetQuantity;
  /** Amount of holding asset in asset currency that isn't in opening orders */
  availableAssetQuantity: AvailableAssetQuantity;
  /** Asset currency of strategy. This can be either base asset or quote asset of symbol */
  assetCurrency: AssetCurrency;

  /** Total current unrealized return (profit and loss) of all opening trades in base currency <br/>
   * (Losses are expressed as negative values.)
   */
  openReturn: Return;
  /** Total current return (profit and loss) of all closed trades in base currency <br/>
   * (Losses are expressed as negative values.)
   */
  netReturn: Return;
  /** Total current profit of all winning trades in base currency */
  netProfit: Profit;
  /** Total current loss of all losing trades in base currency */
  netLoss: Loss;

  /** Current equity in base currency (initialCapital + netReturn + openReturn) */
  equity: Equity;
  /** Maximum equity drawdown value in base currency up until now */
  maxDrawdown: EquityDrawdown;
  /** Maximum equity run-up value in base currency up until now */
  maxRunup: EquityRunup;

  /** Sum of entry and exit fees */
  totalFees: { inCapitalCurrency: FeeAmount; inAssetCurrency: FeeAmount }; //
}>;

export type TotalCapital = number & z.BRAND<'TotalCapital'>;
export type InOrdersCapital = number & z.BRAND<'InOrdersCapital'>;
export type AvailableCapital = number & z.BRAND<'AvailableCapital'>;
export type TotalAssetQuantity = number & z.BRAND<'TotalAssetQuantity'>;
export type InOrdersAssetQuantity = number & z.BRAND<'InOrdersAssetQuantity'>;
export type AvailableAssetQuantity = number & z.BRAND<'AvailableAssetQuantity'>;
export type Return = number & z.BRAND<'Return'>;
export type Profit = number & z.BRAND<'Profit'>;
export type Loss = number & z.BRAND<'Loss'>;
export type Equity = number & z.BRAND<'Equity'>;
export type EquityDrawdown = number & z.BRAND<'EquityDrawdown'>;
export type EquityRunup = number & z.BRAND<'EquityRunup'>;

export function initiateStrategyModule(
  request: {
    name: StrategyName;
    exchange: ExchangeName;
    timeframe: Timeframe;
    takerFeeRate: TakerFeeRate;
    makerFeeRate: MakerFeeRate;
    initialCapital: InitialCapital;
    capitalCurrency: CapitalCurrency;
    assetCurrency: AssetCurrency;
  },
  symbol: Symbol,
): StrategyModule {
  return {
    name: request.name,
    exchange: request.exchange,
    symbol,
    timeframe: request.timeframe,
    takerFeeRate: request.takerFeeRate,
    makerFeeRate: request.makerFeeRate,
    initialCapital: request.initialCapital,
    totalCapital: request.initialCapital as number,
    inOrdersCapital: 0,
    availableCapital: request.initialCapital as number,
    capitalCurrency: request.capitalCurrency,
    totalAssetQuantity: 0,
    inOrdersAssetQuantity: 0,
    availableAssetQuantity: 0,
    assetCurrency: request.assetCurrency,
    netReturn: 0,
    openReturn: 0,
    netProfit: 0,
    netLoss: 0,
    equity: 0,
    maxDrawdown: 0,
    maxRunup: 0,
    totalFees: { inCapitalCurrency: 0, inAssetCurrency: 0 },
  } as StrategyModule;
}

export function transformStrategyModuleWhenPendingOrderTransitToFilled(
  strategyModule: StrategyModule,
  filledOrder: Extract<FilledOrder, { type: 'MARKET' | 'LIMIT' }>,
): e.Either<string, StrategyModule> {
  const { orderSide, quantity, filledPrice, fee } = filledOrder;
  const {
    totalCapital,
    availableCapital,
    totalAssetQuantity,
    availableAssetQuantity,
    totalFees,
    capitalCurrency,
    assetCurrency,
    symbol,
  } = strategyModule;
  const { baseAsset, baseAssetPrecision, quoteAssetPrecision } = symbol;

  const precision = capitalCurrency === baseAsset ? baseAssetPrecision : quoteAssetPrecision;
  const newTotalFees = {
    inCapitalCurrency:
      fee.currency === capitalCurrency
        ? new Decimal(totalFees.inCapitalCurrency).add(fee.amount).toNumber()
        : totalFees.inCapitalCurrency,
    inAssetCurrency:
      fee.currency === assetCurrency
        ? new Decimal(totalFees.inAssetCurrency).add(fee.amount).toNumber()
        : totalFees.inAssetCurrency,
  };

  if (orderSide === 'ENTRY') {
    const capitalToSpend = new Decimal(quantity)
      .times(filledPrice)
      .toDecimalPlaces(precision, Decimal.ROUND_UP);
    const assetToReceive = new Decimal(quantity).minus(fee.amount);

    const newTotalCapital = new Decimal(totalCapital).minus(capitalToSpend).toNumber();
    const newAvailableCapital = new Decimal(availableCapital).minus(capitalToSpend).toNumber();
    const newTotalAssetQuantity = new Decimal(totalAssetQuantity).add(assetToReceive).toNumber();
    const newAvailableAssetQuantity = new Decimal(availableAssetQuantity).add(assetToReceive).toNumber();

    return newAvailableCapital < 0
      ? e.left('Insufficient capital')
      : e.right({
          ...strategyModule,
          totalCapital: newTotalCapital,
          availableCapital: newAvailableCapital,
          totalAssetQuantity: newTotalAssetQuantity,
          availableAssetQuantity: newAvailableAssetQuantity,
          totalFees: newTotalFees,
        } as StrategyModule);
  } else {
    const capitalToReceive = new Decimal(quantity)
      .times(filledPrice)
      .minus(fee.amount)
      .toDecimalPlaces(precision, Decimal.ROUND_UP);

    const newTotalCapital = new Decimal(totalCapital).add(capitalToReceive).toNumber();
    const newAvailableCapital = new Decimal(availableCapital).add(capitalToReceive).toNumber();
    const newTotalAssetQuantity = new Decimal(totalAssetQuantity).minus(quantity).toNumber();
    const newAvailableAssetQuantity = new Decimal(availableAssetQuantity).minus(quantity).toNumber();

    return newAvailableAssetQuantity < 0
      ? e.left('Insufficient asset quantity')
      : e.right({
          ...strategyModule,
          totalCapital: newTotalCapital,
          availableCapital: newAvailableCapital,
          totalAssetQuantity: newTotalAssetQuantity,
          availableAssetQuantity: newAvailableAssetQuantity,
          totalFees: newTotalFees,
        } as StrategyModule);
  }
}

export function transformStrategyModuleWhenPendingOrderTransitToOpening(
  strategyModule: StrategyModule,
  openingOrder: OpeningOrder,
): e.Either<string, StrategyModule> {
  const {
    inOrdersCapital,
    availableCapital,
    inOrdersAssetQuantity,
    availableAssetQuantity,
    symbol,
    capitalCurrency,
  } = strategyModule;
  const { orderSide, quantity } = openingOrder;
  const { baseAsset, baseAssetPrecision, quoteAssetPrecision } = symbol;

  const precision = capitalCurrency === baseAsset ? baseAssetPrecision : quoteAssetPrecision;

  if (orderSide === 'ENTRY') {
    const price = 'limitPrice' in openingOrder ? openingOrder.limitPrice : openingOrder.stopPrice;

    const capitalToSpend = new Decimal(price).times(quantity).toDecimalPlaces(precision, Decimal.ROUND_UP);
    const newInOrdersCapital = new Decimal(inOrdersCapital).add(capitalToSpend).toNumber();
    const newAvailableCapital = new Decimal(availableCapital).minus(capitalToSpend).toNumber();

    return newAvailableCapital < 0
      ? e.left('Insufficient available capital')
      : e.right({
          ...strategyModule,
          inOrdersCapital: newInOrdersCapital,
          availableCapital: newAvailableCapital,
        } as StrategyModule);
  } else {
    const newInOrdersAssetQuantity = new Decimal(inOrdersAssetQuantity).add(quantity).toNumber();
    const newAvailableAssetQuantity = new Decimal(availableAssetQuantity).minus(quantity).toNumber();

    return newAvailableAssetQuantity < 0
      ? e.left('Insufficient available asset quantity')
      : e.right({
          ...strategyModule,
          inOrdersAssetQuantity: newInOrdersAssetQuantity,
          availableAssetQuantity: newAvailableAssetQuantity,
        } as StrategyModule);
  }
}

export function transformStrategyModuleWhenOpeningOrderTransitToFilled(
  strategyModule: StrategyModule,
  filledOrder: Extract<FilledOrder, { type: 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }>,
): e.Either<string, StrategyModule> {
  const { orderSide, quantity, filledPrice, fee } = filledOrder;
  const {
    totalCapital,
    inOrdersCapital,
    availableCapital,
    totalAssetQuantity,
    availableAssetQuantity,
    inOrdersAssetQuantity,
    totalFees,
    capitalCurrency,
    assetCurrency,
    symbol,
  } = strategyModule;
  const { baseAsset, baseAssetPrecision, quoteAssetPrecision } = symbol;

  const precision = capitalCurrency === baseAsset ? baseAssetPrecision : quoteAssetPrecision;

  const newTotalFees = {
    inCapitalCurrency:
      fee.currency === capitalCurrency
        ? new Decimal(totalFees.inCapitalCurrency).add(fee.amount).toNumber()
        : totalFees.inCapitalCurrency,
    inAssetCurrency:
      fee.currency === assetCurrency
        ? new Decimal(totalFees.inAssetCurrency).add(fee.amount).toNumber()
        : totalFees.inAssetCurrency,
  };

  if (orderSide === 'ENTRY') {
    const priceToReserveCapital =
      'limitPrice' in filledOrder ? filledOrder.limitPrice : filledOrder.stopPrice;
    const reservedCapital = new Decimal(quantity)
      .times(priceToReserveCapital)
      .toDecimalPlaces(precision, Decimal.ROUND_UP);
    const actualCapitalToSpend = new Decimal(quantity)
      .times(filledPrice)
      .toDecimalPlaces(precision, Decimal.ROUND_UP);
    const capitalDiff = reservedCapital.minus(actualCapitalToSpend);

    const assetToReceive = new Decimal(quantity).minus(fee.amount);

    const newTotalCapital = new Decimal(totalCapital).minus(actualCapitalToSpend).toNumber();
    const newInOrdersCapital = new Decimal(inOrdersCapital).minus(reservedCapital).toNumber();
    const newAvailableCapital = new Decimal(availableCapital).add(capitalDiff).toNumber();
    const newTotalAssetQuantity = new Decimal(totalAssetQuantity).add(assetToReceive).toNumber();
    const newAvailableAssetQuantity = new Decimal(availableAssetQuantity).add(assetToReceive).toNumber();

    return newInOrdersCapital < 0
      ? e.left('Insufficient in-orders capital')
      : e.right({
          ...strategyModule,
          totalCapital: newTotalCapital,
          inOrdersCapital: newInOrdersCapital,
          availableCapital: newAvailableCapital,
          totalAssetQuantity: newTotalAssetQuantity,
          availableAssetQuantity: newAvailableAssetQuantity,
          totalFees: newTotalFees,
        } as StrategyModule);
  } else {
    const capitalToReceive = new Decimal(quantity)
      .times(filledPrice)
      .minus(fee.amount)
      .toDecimalPlaces(precision, Decimal.ROUND_UP);

    const newTotalCapital = new Decimal(totalCapital).add(capitalToReceive).toNumber();
    const newAvailableCapital = new Decimal(availableCapital).add(capitalToReceive).toNumber();
    const newTotalAssetQuantity = new Decimal(totalAssetQuantity).minus(quantity).toNumber();
    const newInOrdersAssetQuantity = new Decimal(inOrdersAssetQuantity).minus(quantity).toNumber();

    return newInOrdersAssetQuantity < 0
      ? e.left('Insufficient in-orders asset quantity')
      : e.right({
          ...strategyModule,
          totalCapital: newTotalCapital,
          availableCapital: newAvailableCapital,
          totalAssetQuantity: newTotalAssetQuantity,
          inOrdersAssetQuantity: newInOrdersAssetQuantity,
          totalFees: newTotalFees,
        } as StrategyModule);
  }
}

export function transformStrategyModuleWhenOrderTransitToCanceled(
  strategyModule: StrategyModule,
  order: CanceledOrder,
): StrategyModule {
  if (order.orderSide === 'ENTRY') {
    const { inOrdersCapital, availableCapital } = strategyModule;

    const priceToCalculateCapital = 'limitPrice' in order ? order.limitPrice : order.stopPrice;
    const capitalInOrder = new Decimal(order.quantity)
      .times(priceToCalculateCapital)
      .toDecimalPlaces(8, Decimal.ROUND_UP);
    const newInOrdersCapital = new Decimal(inOrdersCapital).minus(capitalInOrder).toNumber();
    const newAvailableCapital = new Decimal(availableCapital).plus(capitalInOrder).toNumber();

    return {
      ...strategyModule,
      inOrdersCapital: newInOrdersCapital,
      availableCapital: newAvailableCapital,
    } as StrategyModule;
  } else {
    const { inOrdersAssetQuantity, availableAssetQuantity } = strategyModule;

    const newInOrdersAssetQuantity = new Decimal(inOrdersAssetQuantity).minus(order.quantity).toNumber();
    const newAvailableAssetQuantity = new Decimal(availableAssetQuantity).plus(order.quantity).toNumber();

    return {
      ...strategyModule,
      inOrdersAssetQuantity: newInOrdersAssetQuantity,
      availableAssetQuantity: newAvailableAssetQuantity,
    } as StrategyModule;
  }
}