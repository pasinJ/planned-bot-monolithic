import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { dissoc } from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import { ExchangeName } from '#features/exchanges/exchange';
import { Timeframe } from '#features/klines/kline';
import { SymbolName } from '#features/symbols/symbol';
import { HttpClient } from '#infra/httpClient.type';
import { ValidDate } from '#shared/utils/date';
import { DurationString, TimezoneString } from '#shared/utils/string';

import {
  BtExecutionId,
  BtExecutionStatus,
  ExecutionLogs,
  ExecutionTime,
  ProgressPercentage,
} from './btExecution';
import {
  AssetCurrency,
  BtRange,
  BtStrategy,
  BtStrategyBody,
  BtStrategyId,
  BtStrategyName,
  CapitalCurrency,
  InitialCapital,
  MakerFeeRate,
  MaxNumKlines,
  StrategyLanguage,
  TakerFeeRate,
} from './btStrategy';
import { BtStrategyRepoError, createBtStrategyRepoError } from './btStrategy.repository.error';
import { API_ENDPOINTS } from './endpoints';
import {
  CanceledOrder,
  FilledOrder,
  OpeningOrder,
  RejectedOrder,
  SubmittedOrder,
  TriggeredOrder,
} from './order';
import {
  MaxEquityDrawdown,
  MaxEquityRunup,
  NetLoss,
  NetProfit,
  ProfitFactor,
  ReturnOfInvestment,
  TotalFees,
  TotalTradeVolume,
  WinLossMetrics,
} from './performance';
import { ClosedTrade, NetReturn, OpeningTrade } from './trade';

export type BtStrategyRepo = {
  getBtStrategyById: GetBtStrategyById;
  getBtStrategies: GetBtStrategies;
  addBtStrategy: AddBtStrategy;
  updateBtStrategy: UpdateBtStrategy;
  executeBtStrategy: ExecuteBtStrategy;
  getExecutionProgress: GetExecutionProgress;
  getExecutionResult: GetExecutionResult;
};
export function createBtStrategyRepo({ httpClient }: { httpClient: HttpClient }): BtStrategyRepo {
  return {
    getBtStrategyById: getBtStrategyById({ httpClient }),
    getBtStrategies: getBtStrategies({ httpClient }),
    addBtStrategy: addBtStrategy({ httpClient }),
    updateBtStrategy: updateBtStrategy({ httpClient }),
    executeBtStrategy: executeBtStrategy({ httpClient }),
    getExecutionProgress: getExecutionProgress({ httpClient }),
    getExecutionResult: getExecutionResult({ httpClient }),
  };
}

type GetBtStrategyById = (id: BtStrategyId) => te.TaskEither<GetBtStrategyByIdError, BtStrategy>;
export type GetBtStrategyByIdError = BtStrategyRepoError<'GetBtStrategyByIdFailed'>;
export function getBtStrategyById({ httpClient }: { httpClient: HttpClient }): GetBtStrategyById {
  const { method, url, responseSchema } = API_ENDPOINTS.GET_BT_STRATEGY;
  return (id) =>
    pipe(
      httpClient.sendRequest({ method, url: url.replace(':btStrategyId', id), responseSchema }),
      te.mapLeft((error) =>
        createBtStrategyRepoError(
          'GetBtStrategyByIdFailed',
          `Getting a backtesting strategy (${id}) from backend failed`,
          error,
        ),
      ),
    );
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
  name: BtStrategyName;
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  maxNumKlines: MaxNumKlines;
  btRange: BtRange;
  timezone: TimezoneString;
  assetCurrency: AssetCurrency;
  capitalCurrency: CapitalCurrency;
  initialCapital: InitialCapital;
  takerFeeRate: TakerFeeRate;
  makerFeeRate: MakerFeeRate;
  language: StrategyLanguage;
  body: BtStrategyBody;
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
  name: BtStrategyName;
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  maxNumKlines: MaxNumKlines;
  btRange: BtRange;
  timezone: TimezoneString;
  assetCurrency: AssetCurrency;
  capitalCurrency: CapitalCurrency;
  initialCapital: InitialCapital;
  takerFeeRate: TakerFeeRate;
  makerFeeRate: MakerFeeRate;
  language: StrategyLanguage;
  body: BtStrategyBody;
};
export type UpdateBtStrategyError = BtStrategyRepoError<'UpdateBtStrategyFailed'>;
function updateBtStrategy({ httpClient }: { httpClient: HttpClient }): UpdateBtStrategy {
  const { method, url, responseSchema } = API_ENDPOINTS.UPDATE_BT_STRATEGY;
  return (request) =>
    pipe(
      httpClient.sendRequest({
        method,
        url: url.replace(':btStrategyId', request.id),
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
      httpClient.sendRequest({ method, url: url.replace(':btStrategyId', btStrategyId), responseSchema }),
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

type GetExecutionResult = (
  btStrategyId: BtStrategyId,
  btExecutionId: BtExecutionId,
) => te.TaskEither<GetExecutionResultError, GetExecutionResultResp>;
export type GetExecutionResultError = BtStrategyRepoError<'GetExecutionResultFailed'>;
export type GetExecutionResultResp = DeepReadonly<{
  status: 'FINISHED';
  executionTimeMs: ExecutionTime;
  logs: ExecutionLogs;
  orders: {
    openingOrders: OpeningOrder[];
    submittedOrders: SubmittedOrder[];
    triggeredOrders: TriggeredOrder[];
    filledOrders: FilledOrder[];
    canceledOrders: CanceledOrder[];
    rejectedOrders: RejectedOrder[];
  };
  trades: { openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] };
  performance: {
    netReturn: NetReturn;
    netProfit: NetProfit;
    netLoss: NetLoss;
    maxDrawdown: MaxEquityDrawdown;
    maxRunup: MaxEquityRunup;
    returnOfInvestment: ReturnOfInvestment;
    profitFactor: ProfitFactor;
    totalTradeVolume: TotalTradeVolume;
    totalFees: TotalFees;
    backtestDuration: DurationString;
    winLossMetrics: WinLossMetrics;
  };
}>;
function getExecutionResult({ httpClient }: { httpClient: HttpClient }): GetExecutionResult {
  const { method, url, responseSchema } = API_ENDPOINTS.GET_EXECUTION_RESULT;
  return (btStrategyId, btExecutionId) =>
    pipe(
      httpClient.sendRequest({
        method,
        url: url.replace(':btStrategyId', btStrategyId).replace(':btExecutionId', btExecutionId),
        responseSchema,
      }),
      te.mapLeft((error) =>
        createBtStrategyRepoError('GetExecutionResultFailed', 'Getting execution result failed', error),
      ),
    );
}
