import { UseQueryResult, useQuery } from '@tanstack/react-query';
import * as e from 'fp-ts/lib/Either';
import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';

import { InfraContext } from '#infra/InfraProvider.context';
import { createGeneralError } from '#shared/errors/generalError';
import { executeTeToPromise } from '#shared/utils/fp';
import { isUndefined } from '#shared/utils/typeGuards';

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

export type UseExecutionProgressResp = {
  status: BtExecutionStatus;
  percentage: ProgressPercentage;
  logs: ExecutionLogs;
};

export default function useExecutionProgress(
  autoFetchEnabled: boolean,
  btExecutionId: BtExecutionId,
): UseQueryResult<UseExecutionProgressResp, GetExecutionProgressError> {
  const { btStrategyRepo } = useContext(InfraContext);
  const params = useParams();
  const btStrategyId = params.btStrategyId;

  const [isFinalStatus, setIsFinalStatus] = useState(false);

  return useQuery<UseExecutionProgressResp, GetExecutionProgressError>({
    enabled: autoFetchEnabled && !isFinalStatus,
    queryKey: isUndefined(btStrategyId) ? undefined : ['btExecutionProgress', btStrategyId, btExecutionId],
    queryFn: () =>
      pipe(
        !isUndefined(btStrategyId)
          ? e.right(params.btStrategyId as BtStrategyId)
          : e.left(
              createGeneralError(
                'ParamsEmpty',
                'ID params is missing from the current path. It is required for updating backtesting strategy',
              ),
            ),
        te.fromEither,
        te.chainW((btStrategyId) => btStrategyRepo.getExecutionProgress(btStrategyId, btExecutionId)),
        te.chainFirstIOK(
          (result) => () =>
            isExecutionInFinalStatus(result) ? setIsFinalStatus(true) : setIsFinalStatus(false),
        ),
        executeTeToPromise,
      ),
    refetchInterval: (data) => (data && isExecutionInFinalStatus(data) ? false : refetchIntervalMs),
  });
}
