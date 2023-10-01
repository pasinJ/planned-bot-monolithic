import { Decimal } from 'decimal.js';
import e from 'fp-ts/lib/Either.js';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import {
  BtStrategyModel,
  BtStrategyName,
  InitialCapital,
  MakerFeeRate,
  MaxNumKlines,
  TakerFeeRate,
} from '#features/btStrategies/dataModels/btStrategy.js';
import { AssetName, SymbolModel } from '#features/symbols/dataModels/symbol.js';

import { ExchangeName } from '../domain/exchange.js';
import { Timeframe } from '../domain/timeframe.js';
import { CanceledOrder, FeeAmount, FilledOrder, OpeningOrder } from './orders.js';

export type StrategyModule = DeepReadonly<{
  /** Name of strategy */
  name: BtStrategyName;
  /** Name of exchange */
  exchange: ExchangeName;
  /** Symbol name */
  symbol: SymbolModel;
  /** Timeframe */
  timeframe: Timeframe;
  /** Taker fee rate for MARKET and STOP_MARKET orders */
  takerFeeRate: TakerFeeRate;
  /** Maker fee rate for LIMIT and STOP_LIMIT orders */
  makerFeeRate: MakerFeeRate;
  /** Maximum number of klines back */
  maxNumKlines: MaxNumKlines;

  /** Amount of initial capital in base currency */
  initialCapital: InitialCapital;
  /** Total current amount of capital in base currency (initialCapital + netReturn) */
  totalCapital: TotalCapital;
  /** Amount of capital in base currency that is in opening orders */
  inOrdersCapital: InOrdersCapital;
  /** Amount of available capital in base currency that isn't in opening orders or opening trades */
  availableCapital: AvailableCapital;
  /** Base currency of strategy. This can be either base asset or quote asset of symbol */
  baseCurrency: AssetName;

  /** Total amount of holding asset in asset currency */
  totalAssetQuantity: TotalAssetQuantity;
  /** Amount of holding asset in asset currency that is in opening orders */
  inOrdersAssetQuantity: InOrdersAssetQuantity;
  /** Amount of holding asset in asset currency that isn't in opening orders */
  availableAssetQuantity: AvailableAssetQuantity;
  /** Asset currency of strategy. This can be either base asset or quote asset of symbol */
  assetCurrency: AssetName;

  /** Total current return (profit and loss) of all closed trades in base currency <br/>
   * (Losses are expressed as negative values.)
   */
  netReturn: Return;
  /** Total current profit of all winning trades in base currency */
  grossProfit: Profit;
  /** Total current unrealized return (profit and loss) of all opening trades in base currency <br/>
   * (Losses are expressed as negative values.)
   */
  openReturn: Return;
  /** Total current loss of all losing trades in base currency */
  grossLoss: Loss;

  /** Current equity in base currency (initialCapital + netReturn + openReturn) */
  equity: Equity;
  /** Maximum equity drawdown value in base currency up until now */
  maxDrawdown: EquityDrawdown;
  /** Maximum equity run-up value in base currency up until now */
  maxRunup: EquityRunup;

  /** Sum of entry and exit fees */
  totalFees: { inBaseCurrency: FeeAmount; inAssetCurrency: FeeAmount }; //
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

export function initiateStrategyModule(btStrategy: BtStrategyModel, symbol: SymbolModel): StrategyModule {
  return {
    name: btStrategy.name,
    exchange: btStrategy.exchange,
    symbol,
    timeframe: btStrategy.timeframe,
    takerFeeRate: btStrategy.takerFeeRate,
    makerFeeRate: btStrategy.makerFeeRate,
    maxNumKlines: btStrategy.maxNumKlines,
    initialCapital: btStrategy.initialCapital,
    totalCapital: btStrategy.initialCapital as number,
    inOrdersCapital: 0,
    availableCapital: btStrategy.initialCapital as number,
    baseCurrency: btStrategy.currency,
    totalAssetQuantity: 0,
    inOrdersAssetQuantity: 0,
    availableAssetQuantity: 0,
    assetCurrency: btStrategy.currency === symbol.baseAsset ? symbol.quoteAsset : symbol.baseAsset,
    netReturn: 0,
    grossProfit: 0,
    openReturn: 0,
    grossLoss: 0,
    equity: 0,
    maxDrawdown: 0,
    maxRunup: 0,
    totalFees: { inBaseCurrency: 0, inAssetCurrency: 0 },
  } as StrategyModule;
}

export function updateStrategyWithFilledOrder(
  strategy: StrategyModule,
  order: FilledOrder,
): e.Either<string, StrategyModule> {
  const {
    totalCapital,
    availableCapital,
    totalAssetQuantity,
    availableAssetQuantity,
    totalFees,
    baseCurrency,
    assetCurrency,
  } = strategy;
  const { orderSide, quantity, filledPrice, fee } = order;

  const newTotalFees = {
    inBaseCurrency:
      fee.currency === baseCurrency
        ? new Decimal(totalFees.inBaseCurrency).add(fee.amount).toNumber()
        : totalFees.inBaseCurrency,
    inAssetCurrency:
      fee.currency === assetCurrency
        ? new Decimal(totalFees.inAssetCurrency).add(fee.amount).toNumber()
        : totalFees.inAssetCurrency,
  };

  if (orderSide === 'ENTRY') {
    const capitalToSpend = new Decimal(quantity).times(filledPrice).toDecimalPlaces(8, Decimal.ROUND_UP);
    const assetToReceive = new Decimal(quantity).minus(fee.amount);

    const newAvailableCapital = new Decimal(availableCapital).minus(capitalToSpend).toNumber();
    const newTotalAssetQuantity = new Decimal(totalAssetQuantity).add(assetToReceive).toNumber();
    const newAvailableAssetQuantity = new Decimal(availableAssetQuantity).add(assetToReceive).toNumber();

    return newAvailableCapital < 0
      ? e.left('Insufficient capital')
      : e.right({
          ...strategy,
          availableCapital: newAvailableCapital,
          totalAssetQuantity: newTotalAssetQuantity,
          availableAssetQuantity: newAvailableAssetQuantity,
          totalFees: newTotalFees,
        } as StrategyModule);
  } else {
    const capitalToReceive = new Decimal(quantity)
      .times(filledPrice)
      .minus(fee.amount)
      .toDecimalPlaces(8, Decimal.ROUND_UP);

    const newTotalCapital = new Decimal(totalCapital).add(capitalToReceive).toNumber();
    const newAvailableCapital = new Decimal(availableCapital).add(capitalToReceive).toNumber();
    const newTotalAssetQuantity = new Decimal(totalAssetQuantity).minus(quantity).toNumber();
    const newAvailableAssetQuantity = new Decimal(availableAssetQuantity).minus(quantity).toNumber();

    return newAvailableAssetQuantity < 0
      ? e.left('Insufficient asset quantity')
      : e.right({
          ...strategy,
          totalCapital: newTotalCapital,
          availableCapital: newAvailableCapital,
          totalAssetQuantity: newTotalAssetQuantity,
          availableAssetQuantity: newAvailableAssetQuantity,
          totalFees: newTotalFees,
        } as StrategyModule);
  }
}

export function updateStrategyWithOpeningOrder(
  strategy: StrategyModule,
  order: OpeningOrder,
): e.Either<string, StrategyModule> {
  const { inOrdersCapital, availableCapital, inOrdersAssetQuantity, availableAssetQuantity } = strategy;
  const { orderSide, quantity } = order;

  if (orderSide === 'ENTRY') {
    const price = 'limitPrice' in order ? order.limitPrice : order.stopPrice;
    const capitalToSpend = new Decimal(price).times(quantity).toDecimalPlaces(8, Decimal.ROUND_UP);
    const newInOrdersCapital = new Decimal(inOrdersCapital).add(capitalToSpend).toNumber();
    const newAvailableCapital = new Decimal(availableCapital).minus(capitalToSpend).toNumber();

    return newAvailableCapital < 0
      ? e.left('Insufficient available capital')
      : e.right({
          ...strategy,
          inOrdersCapital: newInOrdersCapital,
          availableCapital: newAvailableCapital,
        } as StrategyModule);
  } else {
    const newInOrdersAssetQuantity = new Decimal(inOrdersAssetQuantity).add(quantity).toNumber();
    const newAvailableAssetQuantity = new Decimal(availableAssetQuantity).minus(quantity).toNumber();

    return newAvailableAssetQuantity < 0
      ? e.left('Insufficient available asset quantity')
      : e.right({
          ...strategy,
          inOrdersAssetQuantity: newInOrdersAssetQuantity,
          availableAssetQuantity: newAvailableAssetQuantity,
        } as StrategyModule);
  }
}

export function updateStrategyModuleWithCanceledOrder(
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
