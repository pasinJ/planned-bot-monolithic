import { UseQueryResult, useQuery } from '@tanstack/react-query';
import * as e from 'fp-ts/lib/Either';
import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { DeepReadonly } from 'ts-essentials';

import { InfraContext } from '#infra/InfraProvider.context';
import { createGeneralError } from '#shared/errors/generalError';
import { executeTeToPromise } from '#shared/utils/fp';
import { DurationString } from '#shared/utils/string';

import { BtExecutionId, ExecutionLogs, ExecutionTime } from '../btExecution';
import { BtStrategyId } from '../btStrategy';
import { BtStrategyRepoError } from '../btStrategy.repository.error';
import {
  CanceledOrder,
  FilledOrder,
  OpeningOrder,
  RejectedOrder,
  SubmittedOrder,
  TriggeredOrder,
} from '../order';
import {
  BuyAndHoldReturn,
  MaxEquityDrawdown,
  MaxEquityRunup,
  NetLoss,
  NetProfit,
  ProfitFactor,
  ReturnOfInvestment,
  TotalFees,
  TotalTradeVolume,
  WinLossMetrics,
} from '../performance';
import { ClosedTrade, NetReturn, OpeningTrade } from '../trade';

type UseExecutionResultResp = DeepReadonly<{
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
    buyAndHoldReturn: BuyAndHoldReturn;
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
export default function useExecutionResult(
  btExecutionId: BtExecutionId,
): UseQueryResult<UseExecutionResultResp, BtStrategyRepoError<'GetExecutionResultFailed'>> {
  const params = useParams();
  const { btStrategyRepo } = useContext(InfraContext);

  return useQuery<UseExecutionResultResp, BtStrategyRepoError<'GetExecutionResultFailed'>>({
    queryKey: ['executionResult', btExecutionId],
    queryFn: () =>
      pipe(
        params.id !== undefined
          ? e.right(params.id as BtStrategyId)
          : e.left(
              createGeneralError(
                'ParamsEmpty',
                'ID params is missing from the current path. It is required for getting backtesting strategy',
              ),
            ),
        te.fromEither,
        te.chainW((btStrategyId) => btStrategyRepo.getExecutionResult(btStrategyId, btExecutionId)),
        executeTeToPromise,
      ),
  });
}
