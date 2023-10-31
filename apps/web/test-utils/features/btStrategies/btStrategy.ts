import { faker } from '@faker-js/faker';
import { mergeRight } from 'ramda';

import {
  AssetCurrency,
  BtRange,
  BtStrategy,
  BtStrategyBody,
  BtStrategyId,
  BtStrategyName,
  CapitalCurrency,
  InitialCapital,
  MakerFeeRate,
  MaxNumKlines,
  TakerFeeRate,
} from '#features/btStrategies/btStrategy';
import { exchangeNameEnum } from '#features/exchanges/exchange';
import { timeframeEnum } from '#features/klines/kline';
import { SymbolName } from '#features/symbols/symbol';
import { ValidDate } from '#shared/utils/date';
import { TimezoneString } from '#shared/utils/string';

export function mockBtStrategy(overrides?: Partial<BtStrategy>): BtStrategy {
  return mergeRight<BtStrategy, Partial<BtStrategy>>(
    {
      id: faker.string.nanoid() as BtStrategyId,
      name: 'New strategy' as BtStrategyName,
      exchange: exchangeNameEnum.BINANCE,
      symbol: 'BTCUSDT' as SymbolName,
      timeframe: timeframeEnum['1d'],
      assetCurrency: 'BTC' as AssetCurrency,
      capitalCurrency: 'USDT' as CapitalCurrency,
      initialCapital: 999.99 as InitialCapital,
      takerFeeRate: 0.9 as TakerFeeRate,
      makerFeeRate: 0.9 as MakerFeeRate,
      maxNumKlines: 99 as MaxNumKlines,
      btRange: { start: new Date('2022-04-04'), end: new Date('2022-04-05') } as BtRange,
      timezone: 'Asia/Bangkok' as TimezoneString,
      language: 'javascript',
      body: `console.log("Hello world")` as BtStrategyBody,
      version: 0,
      createdAt: new Date('2022-04-06') as ValidDate,
      updatedAt: new Date('2022-04-06') as ValidDate,
    },
    overrides ?? {},
  );
}
