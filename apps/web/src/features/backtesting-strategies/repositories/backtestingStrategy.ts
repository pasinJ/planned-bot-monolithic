import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';

import { API_ENDPOINTS } from './backtestingStrategy.constant';
import {
  CreateBacktestingStrategy,
  CreateBacktestingStrategyError,
  GetBacktestingStrategies,
  GetBacktestingStrategiesError,
} from './backtestingStrategy.type';

const { GET_BACKTESTING_STRATEGIES, CREATE_BACKTESTING_STRATEGY } = API_ENDPOINTS;

export function getBacktestingStrategies(
  ...[{ httpClient }]: Parameters<GetBacktestingStrategies>
): ReturnType<GetBacktestingStrategies> {
  const { method, url, responseSchema } = GET_BACKTESTING_STRATEGIES;
  return pipe(
    httpClient.sendRequest({ method, url, responseSchema }),
    te.mapLeft(
      (error) =>
        new GetBacktestingStrategiesError(
          'GET_BACKTESTING_STRATEGIES_ERROR',
          'Failed to get backtesting strategies',
          error,
        ),
    ),
  );
}

export function createBacktestingStrategy(
  ...[data, { httpClient }]: Parameters<CreateBacktestingStrategy>
): ReturnType<CreateBacktestingStrategy> {
  const { method, url, responseSchema } = CREATE_BACKTESTING_STRATEGY;

  return pipe(
    httpClient.sendRequest({ method, url, responseSchema, body: data }),
    te.mapLeft(
      (error) =>
        new CreateBacktestingStrategyError(
          'CREATE_BACKTESTING_STRATEGY_ERROR',
          'Failed to create backtesting strategy',
          error,
        ),
    ),
  );
}
