import { UseMutationResult, useMutation } from '@tanstack/react-query';
import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';

import { InfraContext } from '#infra/InfraProvider.context';
import { createGeneralError } from '#shared/errors/generalError';
import { ValidDate } from '#shared/utils/date';
import { executeTeToPromise } from '#shared/utils/fp';

import { BtExecutionId } from '../btExecution';
import { BtStrategyId } from '../btStrategy';
import { BtStrategyRepoError } from '../btStrategy.repository.error';

export default function useExecuteBtStrategy(): UseMutationResult<
  { id: BtExecutionId; createdAt: ValidDate },
  BtStrategyRepoError<'ExecuteBtStrategyFailed'>,
  void
> {
  const params = useParams();
  const { btStrategyRepo } = useContext(InfraContext);

  return useMutation({
    mutationFn: () =>
      pipe(
        params.id !== undefined
          ? te.right(params.id as BtStrategyId)
          : te.left(
              createGeneralError(
                'ParamsEmpty',
                'ID params is missing from the current path. It is required for executing backtesting strategy',
              ),
            ),
        te.chainW(btStrategyRepo.executeBtStrategy),
        executeTeToPromise,
      ),
  });
}
