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

import { BtExecutionId, ExecutionLogs, ExecutionTime } from '../btExecution';
import { BtStrategyId } from '../btStrategy';
import { GetExecutionResultError } from '../btStrategy.repository';
import { OrdersLists } from '../order';
import { PerformanceMetrics } from '../performance';
import { TradesLists } from '../trade';

export type UseExecutionResultResp = DeepReadonly<{
  status: 'FINISHED';
  executionTimeMs: ExecutionTime;
  logs: ExecutionLogs;
  orders: OrdersLists;
  trades: TradesLists;
  performance: PerformanceMetrics;
}>;

export default function useExecutionResult(
  autoFetchEnabled: boolean,
  btExecutionId: BtExecutionId,
): UseQueryResult<UseExecutionResultResp, GetExecutionResultError> {
  const params = useParams();
  const { btStrategyRepo } = useContext(InfraContext);

  return useQuery<UseExecutionResultResp, GetExecutionResultError>({
    enabled: autoFetchEnabled,
    staleTime: Infinity,
    queryKey: ['executionResult', btExecutionId],
    queryFn: () =>
      pipe(
        params.btStrategyId !== undefined
          ? e.right(params.btStrategyId as BtStrategyId)
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
