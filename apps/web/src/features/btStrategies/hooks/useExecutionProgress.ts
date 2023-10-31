import { UseQueryResult, useQuery } from '@tanstack/react-query';
import * as e from 'fp-ts/lib/Either';
import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';

import { InfraContext } from '#infra/InfraProvider.context';
import { createGeneralError } from '#shared/errors/generalError';
import { executeTeToPromise } from '#shared/utils/fp';

import {
  BtExecutionId,
  BtExecutionStatus,
  ExecutionLogs,
  ProgressPercentage,
  isExecutionInFinalStatus,
} from '../btExecution';
import { BtStrategyId } from '../btStrategy';
import { GetExecutionProgressError } from '../btStrategy.repository';

const refetchIntervalMs = 1000;
const staleTime = Infinity;

export type UseExecutionProgressResp = {
  status: BtExecutionStatus;
  percentage: ProgressPercentage;
  logs: ExecutionLogs;
};

export default function useExecutionProgress(
  btExecutionId: BtExecutionId,
): UseQueryResult<UseExecutionProgressResp, GetExecutionProgressError> {
  const params = useParams();
  const { btStrategyRepo } = useContext(InfraContext);

  return useQuery<UseExecutionProgressResp, GetExecutionProgressError>({
    queryKey: ['executionProgress', btExecutionId],
    queryFn: () =>
      pipe(
        params.btStrategyId !== undefined
          ? e.right(params.btStrategyId as BtStrategyId)
          : e.left(
              createGeneralError(
                'ParamsEmpty',
                'ID params is missing from the current path. It is required for updating backtesting strategy',
              ),
            ),
        te.fromEither,
        te.chainW((btStrategyId) => btStrategyRepo.getExecutionProgress(btStrategyId, btExecutionId)),
        executeTeToPromise,
      ),
    refetchInterval: (data) => (data && isExecutionInFinalStatus(data) ? false : refetchIntervalMs),
    staleTime,
  });
}
