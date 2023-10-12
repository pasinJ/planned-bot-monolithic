import { mergeRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import {
  BtBody,
  BtEndTimestamp,
  BtStartTimestamp,
  BtStrategyId,
  BtStrategyModel,
  BtStrategyName,
  MaxNumKlines,
} from '#features/btStrategies/dataModels/btStrategy.js';
import { exchangeNameEnum } from '#features/shared/exchange.js';
import {
  CapitalCurrency,
  InitialCapital,
  MakerFeeRate,
  TakerFeeRate,
  languageEnum,
} from '#features/shared/strategy.js';
import { SymbolName } from '#features/shared/symbol.js';
import { timeframeEnum } from '#features/shared/timeframe.js';
import { ValidDate } from '#shared/utils/date.js';
import { TimezoneString } from '#shared/utils/string.js';
import { Unbrand } from '#shared/utils/types.js';

export function mockBtStrategyModel(overrides?: DeepPartial<Unbrand<BtStrategyModel>>): BtStrategyModel {
  return mergeRight<BtStrategyModel, DeepPartial<Unbrand<BtStrategyModel>>>(
    {
      id: 'Js9BAbCmVw' as BtStrategyId,
      name: 'Long term' as BtStrategyName,
      exchange: exchangeNameEnum.BINANCE,
      symbol: 'BNBUSDT' as SymbolName,
      timeframe: timeframeEnum['1d'],
      initialCapital: 1000.1 as InitialCapital,
      capitalCurrency: 'USDT' as CapitalCurrency,
      takerFeeRate: 1.1 as TakerFeeRate,
      makerFeeRate: 2.1 as MakerFeeRate,
      maxNumKlines: 10 as MaxNumKlines,
      startTimestamp: new Date('2022-10-12') as BtStartTimestamp,
      endTimestamp: new Date('2022-10-13') as BtEndTimestamp,
      timezone: 'UTC' as TimezoneString,
      language: languageEnum.javascript,
      body: 'console.log("Hello")' as BtBody,
      version: 0,
      createdAt: new Date('2022-12-12') as ValidDate,
      updatedAt: new Date('2022-12-12') as ValidDate,
    },
    overrides ?? {},
  ) as BtStrategyModel;
}
