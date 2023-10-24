import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { dissoc } from 'ramda';

import { ExchangeName } from '#features/exchanges/exchange';
import { Timeframe } from '#features/klines/kline';
import { BaseAsset, QuoteAsset, SymbolName } from '#features/symbols/symbol';
import { HttpClient } from '#infra/httpClient.type';
import { ValidDate } from '#shared/utils/date';
import { TimezoneString } from '#shared/utils/string';

import { BtExecutionId, BtExecutionStatus, ExecutionLogs, ProgressPercentage } from './btExecution';
import { BtStrategy, BtStrategyId } from './btStrategy';
import { BtStrategyRepoError, createBtStrategyRepoError } from './btStrategy.repository.error';
import { API_ENDPOINTS } from './endpoints';

export type BtStrategyRepo = {
  getBtStrategies: GetBtStrategies;
  addBtStrategy: AddBtStrategy;
  updateBtStrategy: UpdateBtStrategy;
  executeBtStrategy: ExecuteBtStrategy;
  getExecutionProgress: GetExecutionProgress;
};
export function createBtStrategyRepo({ httpClient }: { httpClient: HttpClient }): BtStrategyRepo {
  return {
    getBtStrategies: getBtStrategies({ httpClient }),
    addBtStrategy: addBtStrategy({ httpClient }),
    updateBtStrategy: updateBtStrategy({ httpClient }),
    executeBtStrategy: executeBtStrategy({ httpClient }),
    getExecutionProgress: getExecutionProgress({ httpClient }),
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

type UpdateBtStrategy = (request: UpdateBtStrategyRequest) => te.TaskEither<UpdateBtStrategyError, void>;
export type UpdateBtStrategyRequest = {
  id: BtStrategyId;
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
export type UpdateBtStrategyError = BtStrategyRepoError<'UpdateBtStrategyFailed'>;
function updateBtStrategy({ httpClient }: { httpClient: HttpClient }): UpdateBtStrategy {
  const { method, url, responseSchema } = API_ENDPOINTS.UPDATE_BT_STRATEGY;
  return (request) =>
    pipe(
      httpClient.sendRequest({
        method,
        url: url.replace(':id', request.id),
        responseSchema,
        body: dissoc('id', request),
      }),
      te.mapLeft((error) =>
        createBtStrategyRepoError('UpdateBtStrategyFailed', 'Updating backtesting strategy failed', error),
      ),
      te.asUnit,
    );
}

type ExecuteBtStrategy = (
  btStrategyId: BtStrategyId,
) => te.TaskEither<ExecuteBtStrategyError, ExecuteBtStrategyResult>;
export type ExecuteBtStrategyError = BtStrategyRepoError<'ExecuteBtStrategyFailed'>;
export type ExecuteBtStrategyResult = { id: BtExecutionId; createdAt: ValidDate };
function executeBtStrategy({ httpClient }: { httpClient: HttpClient }): ExecuteBtStrategy {
  const { method, url, responseSchema } = API_ENDPOINTS.EXECUTE_BT_STRATEGY;
  return (btStrategyId) =>
    pipe(
      httpClient.sendRequest({ method, url: url.replace(':id', btStrategyId), responseSchema }),
      te.mapLeft((error) =>
        createBtStrategyRepoError(
          'ExecuteBtStrategyFailed',
          'Start execution of backtesting strategy failed',
          error,
        ),
      ),
    );
}

type GetExecutionProgress = (
  btStrategyId: BtStrategyId,
  btExecutionId: BtExecutionId,
) => te.TaskEither<GetExecutionProgressError, GetExecutionProgressResult>;
export type GetExecutionProgressError = BtStrategyRepoError<'GetExecutionProgressFailed'>;
export type GetExecutionProgressResult = {
  status: BtExecutionStatus;
  percentage: ProgressPercentage;
  logs: ExecutionLogs;
};
function getExecutionProgress({ httpClient }: { httpClient: HttpClient }): GetExecutionProgress {
  const { method, url, responseSchema } = API_ENDPOINTS.GET_EXECUTION_PROGRESS;
  return (btStrategyId, btExecutionId) =>
    pipe(
      httpClient.sendRequest({
        method,
        url: url.replace(':btStrategyId', btStrategyId).replace(':btExecutionId', btExecutionId),
        responseSchema,
      }),
      te.mapLeft((error) =>
        createBtStrategyRepoError('GetExecutionProgressFailed', 'Getting execution progress failed', error),
      ),
    );
}
