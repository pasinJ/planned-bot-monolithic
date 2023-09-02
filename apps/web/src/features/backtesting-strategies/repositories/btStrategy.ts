import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';

import { HttpClient } from '#infra/httpClient.type';

import { API_ENDPOINTS } from './btStrategy.constant';
import { AddBtStrategyError, BtStrategyRepo, GetBtStrategiesError } from './btStrategy.type';

const { GET_BT_STRATEGIES, ADD_BT_STRATEGY } = API_ENDPOINTS;

export function createBtStrategyRepo({ httpClient }: { httpClient: HttpClient }): BtStrategyRepo {
  return {
    getBtStrategies: getBtStrategies({ httpClient }),
    addBtStrategy: addBtStrategy({ httpClient }),
  };
}

export function getBtStrategies({
  httpClient,
}: {
  httpClient: HttpClient;
}): BtStrategyRepo['getBtStrategies'] {
  const { method, url, responseSchema } = GET_BT_STRATEGIES;
  return pipe(
    httpClient.sendRequest({ method, url, responseSchema }),
    te.mapLeft((error) => new GetBtStrategiesError().causedBy(error)),
  );
}

export function addBtStrategy({ httpClient }: { httpClient: HttpClient }): BtStrategyRepo['addBtStrategy'] {
  return (data) => {
    const { method, url, responseSchema } = ADD_BT_STRATEGY;
    return pipe(
      httpClient.sendRequest({ method, url, responseSchema, body: data }),
      te.mapLeft((error) => new AddBtStrategyError().causedBy(error)),
    );
  };
}
