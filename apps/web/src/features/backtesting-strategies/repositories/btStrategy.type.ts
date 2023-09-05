import * as te from 'fp-ts/lib/TaskEither';

import { ExchangeName } from '#features/exchanges/domain/exchange';
import { Timeframe } from '#shared/domain/timeframe';

import { BtStrategy } from '../domain/btStrategy.entity';
import { BtStrategyRepoError } from './btStrategy.error';

export type BtStrategyRepo = {
  getBtStrategies: te.TaskEither<BtStrategyRepoError<'GetStrategiesError'>, readonly BtStrategy[]>;
  addBtStrategy: (data: AddBtStrategyData) => te.TaskEither<BtStrategyRepoError<'AddBtStrategyError'>, void>;
};

export type AddBtStrategyData = {
  name: string;
  exchange: ExchangeName;
  symbol: string;
  currency: string;
  timeframe: Timeframe;
  maxNumKlines: number;
  initialCapital: number;
  takerFeeRate: number;
  makerFeeRate: number;
  startTimestamp: Date;
  endTimestamp: Date;
  body: string;
};
