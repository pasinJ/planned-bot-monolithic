import { UseQueryResult, useQuery } from '@tanstack/react-query';
import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { isNotNil } from 'ramda';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';

import { InfraContext } from '#infra/InfraProvider.context';
import { GeneralError, createGeneralError } from '#shared/errors/generalError';
import { executeTeToPromise } from '#shared/utils/fp';
import { isUndefined } from '#shared/utils/typeGuards';

import { BtStrategy, BtStrategyId } from '../btStrategy';
import { GetBtStrategyByIdError } from '../btStrategy.repository';

export default function useBtStrategy(
  autoFetchEnabled: boolean,
  btStrategyId?: BtStrategyId,
): UseQueryResult<BtStrategy, GetBtStrategyByIdError | GeneralError<'ParamsEmpty'>> {
  const { btStrategyRepo } = useContext(InfraContext);
  const params = useParams();
  const isEnabled = autoFetchEnabled && isNotNil(btStrategyId ?? params.btStrategyId);

  return useQuery({
    enabled: isEnabled,
    queryKey: isEnabled ? ['btStrategy', btStrategyId ?? params.btStrategyId] : undefined,
    staleTime: Infinity,
    queryFn: () =>
      executeTeToPromise(
        pipe(
          !isUndefined(btStrategyId)
            ? btStrategyRepo.getBtStrategyById(btStrategyId)
            : !isUndefined(params.btStrategyId)
            ? btStrategyRepo.getBtStrategyById(params.btStrategyId as BtStrategyId)
            : te.left(
                createGeneralError(
                  'ParamsEmpty',
                  'Backtesting strategy ID is required from path or hook parameter',
                ),
              ),
        ) as te.TaskEither<GetBtStrategyByIdError | GeneralError<'ParamsEmpty'>, BtStrategy>,
      ),
  });
}
