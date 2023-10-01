import { DeepPartial } from 'ts-essentials';

import { StrategyModule } from '#features/shared/executorModules/strategy.js';
import { Unbrand } from '#shared/utils/types.js';

import { mockBtStrategy } from '../btStrategies/models.js';
import { mockSymbol } from '../symbols/models.js';

export function mockStrategyModule(override?: DeepPartial<Unbrand<StrategyModule>>): StrategyModule {
  const symbol = mockSymbol({ filters: [], orderTypes: ['MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LOSS_LIMIT'] });
  const btStrategy = mockBtStrategy({ symbol: symbol.name, currency: symbol.quoteAsset });

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
    ...override,
  } as StrategyModule;
}
