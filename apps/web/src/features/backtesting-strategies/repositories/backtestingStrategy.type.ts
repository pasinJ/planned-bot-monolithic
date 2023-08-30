import * as te from 'fp-ts/lib/TaskEither';

import { Exchange } from '#features/shared/domain/exchange';
import { Timeframe } from '#features/shared/domain/timeframe';
import { HttpClient, HttpError } from '#infra/httpClient.type';
import { ErrorBase } from '#utils/error';
import { SchemaValidationError } from '#utils/zod';

import { BacktestingStrategy } from '../domain/backtestingStrategy.entity';

export type GetBacktestingStrategies = (
  deps: GetBacktestingStrategiesDeps,
) => te.TaskEither<GetBacktestingStrategiesError, BacktestingStrategy[]>;
type GetBacktestingStrategiesDeps = { httpClient: HttpClient };
export class GetBacktestingStrategiesError extends ErrorBase<'GET_BACKTESTING_STRATEGIES_ERROR', HttpError> {}

export type CreateBacktestingStrategy = (
  data: CreateBacktestingStrategyData,
  deps: CreateBacktestingStrategyDeps,
) => te.TaskEither<CreateBacktestingStrategyError, BacktestingStrategy>;
type CreateBacktestingStrategyData = {
  name: string;
  exchange: Exchange;
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
type CreateBacktestingStrategyDeps = { httpClient: HttpClient };
export class CreateBacktestingStrategyError extends ErrorBase<
  'CREATE_BACKTESTING_STRATEGY_ERROR',
  HttpError | SchemaValidationError
> {}
