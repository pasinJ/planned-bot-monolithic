import * as te from 'fp-ts/lib/TaskEither';

import { ExchangeName } from '#features/exchanges/domain/exchange';
import { Timeframe } from '#features/shared/domain/timeframe';
import { HttpError } from '#infra/httpClient.type';
import { CustomError } from '#utils/error';
import { SchemaValidationError } from '#utils/zod';

import { BtStrategy } from '../domain/btStrategy.entity';

export type BtStrategyRepo = {
  getBtStrategies: te.TaskEither<GetBtStrategiesError, readonly BtStrategy[]>;
  addBtStrategy: (data: AddBtStrategyData) => te.TaskEither<AddBtStrategyError, void>;
};

export class GetBtStrategiesError extends CustomError<'GET_BT_STRATEGIES_ERROR', HttpError>(
  'GET_BT_STRATEGIES_ERROR',
  'Error happened when try to get backtesting strategies',
) {}

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
export class AddBtStrategyError extends CustomError<'ADD_BT_STRATEGY_ERROR', AddBtStrategyErrorCause>(
  'ADD_BT_STRATEGY_ERROR',
  'Error happened when try to add a backtesting strategy',
) {}
type AddBtStrategyErrorCause = HttpError | SchemaValidationError;
