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
  btExecutionStatusEnum,
} from '../btExecution';
import { BtStrategyId } from '../btStrategy';
import { BtStrategyRepoError } from '../btStrategy.repository.error';

const refetchIntervalMs = 1000;

type UseExecutionProgressResult = {
  status: BtExecutionStatus;
  percentage: ProgressPercentage;
  logs: ExecutionLogs;
};
export default function useExecutionProgress(
  btExecutionId: BtExecutionId,
): UseQueryResult<UseExecutionProgressResult, BtStrategyRepoError<'GetExecutionProgressFailed'>> {
  const params = useParams();
  const { btStrategyRepo } = useContext(InfraContext);

  return useQuery<UseExecutionProgressResult, BtStrategyRepoError<'GetExecutionProgressFailed'>>({
    queryKey: ['executionProgress', btExecutionId],
    queryFn: () =>
      pipe(
        params.id !== undefined
          ? e.right(params.id as BtStrategyId)
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
    refetchInterval: (data) =>
      data?.status === btExecutionStatusEnum.PENDING || data?.status === btExecutionStatusEnum.RUNNING
        ? refetchIntervalMs
        : false,
  });
}
