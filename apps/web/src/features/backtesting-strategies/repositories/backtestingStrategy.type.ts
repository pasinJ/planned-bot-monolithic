import * as te from 'fp-ts/lib/TaskEither';

import { HttpClient, HttpError } from '#infra/httpClient.type';
import { ErrorBase } from '#utils/error';

import { BacktestingStrategy } from '../domain/backtestingStrategy.entity';

export type GetBacktestingStrategies = (
  deps: GetBacktestingStrategiesDeps,
) => te.TaskEither<GetBacktestingStrategiesError, BacktestingStrategy[]>;
type GetBacktestingStrategiesDeps = { httpClient: HttpClient };
export class GetBacktestingStrategiesError extends ErrorBase<'GET_BACKTESTING_STRATEGIES_ERROR', HttpError> {}
