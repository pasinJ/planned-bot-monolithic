import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';

import { ExchangeName } from '#features/exchanges/exchange';
import { Timeframe } from '#features/klines/kline';
import { BaseAsset, QuoteAsset, SymbolName } from '#features/symbols/symbol';
import { HttpClient } from '#infra/httpClient.type';
import { ValidDate } from '#shared/utils/date';
import { TimezoneString } from '#shared/utils/string';

import { BtStrategy, BtStrategyId } from './btStrategy';
import { BtStrategyRepoError, createBtStrategyRepoError } from './btStrategy.repository.error';
import { API_ENDPOINTS } from './endpoints';

export type BtStrategyRepo = { getBtStrategies: GetBtStrategies; addBtStrategy: AddBtStrategy };
export function createBtStrategyRepo({ httpClient }: { httpClient: HttpClient }): BtStrategyRepo {
  return {
    getBtStrategies: getBtStrategies({ httpClient }),
    addBtStrategy: addBtStrategy({ httpClient }),
  };
}

type GetBtStrategies = te.TaskEither<GetBtStrategiesError, readonly BtStrategy[]>;
export type GetBtStrategiesError = BtStrategyRepoError<'GetBtStrategiesFailed'>;
export function getBtStrategies({ httpClient }: { httpClient: HttpClient }): GetBtStrategies {
  const { method, url, responseSchema } = API_ENDPOINTS.GET_BT_STRATEGIES;
  return pipe(
    httpClient.sendRequest({ method, url, responseSchema }),
    te.mapLeft((error) =>
      createBtStrategyRepoError(
        'GetBtStrategiesFailed',
        'Getting backtesting strategies from backend failed',
        error,
      ),
    ),
  );
}

type AddBtStrategy = (
  request: AddBtStrategyRequest,
) => te.TaskEither<AddBtStrategyError, AddBtStrategyResult>;
export type AddBtStrategyRequest = {
  name: string;
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  maxNumKlines: number;
  startTimestamp: ValidDate;
  endTimestamp: ValidDate;
  timezone: TimezoneString;
  capitalCurrency: BaseAsset | QuoteAsset;
  initialCapital: number;
  takerFeeRate: number;
  makerFeeRate: number;
  body: string;
};
export type AddBtStrategyError = BtStrategyRepoError<'AddBtStrategyFailed'>;
export type AddBtStrategyResult = { id: BtStrategyId; createdAt: ValidDate };
export function addBtStrategy({ httpClient }: { httpClient: HttpClient }): AddBtStrategy {
  return (request) => {
    return pipe(
      httpClient.sendRequest({ ...API_ENDPOINTS.ADD_BT_STRATEGY, body: request }),
      te.mapLeft((error) =>
        createBtStrategyRepoError(
          'AddBtStrategyFailed',
          'Adding a new backtesting strategy to backend failed',
          error,
        ),
      ),
    );
  };
}
