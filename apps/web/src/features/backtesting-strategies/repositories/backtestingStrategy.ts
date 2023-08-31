import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';

import { API_ENDPOINTS } from './backtestingStrategy.constant';
import {
  AddBtStrategy,
  AddBtStrategyError,
  GetBtStrategies,
  GetBtStrategiesError,
} from './backtestingStrategy.type';

const { GET_BT_STRATEGIES, ADD_BT_STRATEGY } = API_ENDPOINTS;

export function getBtStrategies(
  ...[{ httpClient }]: Parameters<GetBtStrategies>
): ReturnType<GetBtStrategies> {
  const { method, url, responseSchema } = GET_BT_STRATEGIES;
  return pipe(
    httpClient.sendRequest({ method, url, responseSchema }),
    te.mapLeft((error) => new GetBtStrategiesError().causedBy(error)),
  );
}

export function addBtStrategy(
  ...[data, { httpClient }]: Parameters<AddBtStrategy>
): ReturnType<AddBtStrategy> {
  const { method, url, responseSchema } = ADD_BT_STRATEGY;

  return pipe(
    httpClient.sendRequest({ method, url, responseSchema, body: data }),
    te.mapLeft((error) => new AddBtStrategyError().causedBy(error)),
  );
}
