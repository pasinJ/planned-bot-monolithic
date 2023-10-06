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
} from '#features/shared/strategyExecutorModules/strategy.js';
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
      takerFeeRate: 1 as TakerFeeRate,
      makerFeeRate: 2 as MakerFeeRate,
      symbol,
      initialCapital: 1000 as InitialCapital,
      totalCapital: 1000 as TotalCapital,
      inOrdersCapital: 0 as InOrdersCapital,
      availableCapital: 1000 as AvailableCapital,
      capitalCurrency: symbol.quoteAsset as CapitalCurrency,
      totalAssetQuantity: 0 as TotalAssetQuantity,
      inOrdersAssetQuantity: 0 as InOrdersAssetQuantity,
      availableAssetQuantity: 0 as AvailableAssetQuantity,
      assetCurrency: symbol.baseAsset as AssetCurrency,
      openReturn: 0 as Return,
      netReturn: 0 as Return,
      netProfit: 0 as Profit,
      netLoss: 0 as Loss,
      equity: 0 as Equity,
      maxDrawdown: 0 as EquityDrawdown,
      maxRunup: 0 as EquityRunup,
      totalFees: { inCapitalCurrency: 0 as FeeAmount, inAssetCurrency: 0 as FeeAmount },
    },
    override ?? {},
  ) as StrategyModule;
}
