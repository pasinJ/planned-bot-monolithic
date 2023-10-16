import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { exchangeNameEnum } from '#features/shared/exchange.js';
import { FeeAmount } from '#features/shared/order.js';
import {
  AssetCurrency,
  CapitalCurrency,
  InitialCapital,
  MakerFeeRate,
  StrategyName,
  TakerFeeRate,
} from '#features/shared/strategy.js';
import {
  AvailableAssetQuantity,
  AvailableCapital,
  Equity,
  EquityDrawdown,
  EquityRunup,
  InOrdersAssetQuantity,
  InOrdersCapital,
  Loss,
  Profit,
  Return,
  StrategyModule,
  TotalAssetQuantity,
  TotalCapital,
} from '#features/shared/strategyExecutorContext/strategy.js';
import { timeframeEnum } from '#features/shared/timeframe.js';
import { Unbrand } from '#shared/utils/types.js';

import { mockBnbSymbol } from './bnbSymbol.js';

export function mockStrategyModule(override?: DeepPartial<Unbrand<StrategyModule>>): StrategyModule {
  const symbol = mockBnbSymbol({ orderTypes: ['MARKET', 'LIMIT', 'STOP_LIMIT', 'STOP_MARKET'] });

  return mergeDeepRight<StrategyModule, DeepPartial<Unbrand<StrategyModule>>>(
    {
      name: 'test' as StrategyName,
      exchange: exchangeNameEnum.BINANCE,
      timeframe: timeframeEnum['1d'],
      takerFeeRate: 99 as TakerFeeRate,
      makerFeeRate: 99 as MakerFeeRate,
      symbol,
      initialCapital: 9999 as InitialCapital,
      totalCapital: 9999 as TotalCapital,
      inOrdersCapital: 5999 as InOrdersCapital,
      availableCapital: 9999 as AvailableCapital,
      capitalCurrency: symbol.quoteAsset as CapitalCurrency,
      totalAssetQuantity: 99 as TotalAssetQuantity,
      inOrdersAssetQuantity: 99 as InOrdersAssetQuantity,
      availableAssetQuantity: 99 as AvailableAssetQuantity,
      assetCurrency: symbol.baseAsset as AssetCurrency,
      openReturn: 99 as Return,
      netReturn: 99 as Return,
      netProfit: 99 as Profit,
      netLoss: -99 as Loss,
      equity: 1000 as Equity,
      maxDrawdown: -99 as EquityDrawdown,
      maxRunup: 99 as EquityRunup,
      totalFees: { inCapitalCurrency: 99 as FeeAmount, inAssetCurrency: 99 as FeeAmount },
    },
    override ?? {},
  ) as StrategyModule;
}
