import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';

import { ExchangeName } from '#features/exchanges/domain/exchange';
import { Timeframe } from '#features/klines/kline';
import { HttpClient } from '#infra/httpClient.type';

import { BtStrategy } from '../domain/btStrategy.entity';
import { API_ENDPOINTS } from './btStrategy.constant';
import { BtStrategyRepoError, createBtStrategyRepoError } from './btStrategy.error';

export type BtStrategyRepo = { getBtStrategies: GetBtStrategies; addBtStrategy: AddBtStrategy };
export function createBtStrategyRepo({ httpClient }: { httpClient: HttpClient }): BtStrategyRepo {
  return {
    getBtStrategies: getBtStrategies({ httpClient }),
    addBtStrategy: addBtStrategy({ httpClient }),
  };
}

type GetBtStrategies = te.TaskEither<GetBtStrategiesError, readonly BtStrategy[]>;
export type GetBtStrategiesError = BtStrategyRepoError<'GetStrategiesError'>;
export function getBtStrategies({ httpClient }: { httpClient: HttpClient }): GetBtStrategies {
  const { method, url, responseSchema } = API_ENDPOINTS.GET_BT_STRATEGIES;
  return pipe(
    httpClient.sendRequest({ method, url, responseSchema }),
    te.mapLeft((error) =>
      createBtStrategyRepoError(
        'GetStrategiesError',
        'Getting backtesting strategies from backend failed',
        error,
      ),
    ),
  );
}

type AddBtStrategy = (data: AddBtStrategyData) => te.TaskEither<AddBtStrategyError, void>;
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
export type AddBtStrategyError = BtStrategyRepoError<'AddBtStrategyError'>;
export function addBtStrategy({ httpClient }: { httpClient: HttpClient }): AddBtStrategy {
  return (data) => {
    const { method, url, responseSchema } = API_ENDPOINTS.ADD_BT_STRATEGY;
    return pipe(
      httpClient.sendRequest({ method, url, responseSchema, body: data }),
      te.mapLeft((error) =>
        createBtStrategyRepoError(
          'AddBtStrategyError',
          'Adding a new backtesting strategy to backend failed',
          error,
        ),
      ),
      te.asUnit,
    );
  };
}
