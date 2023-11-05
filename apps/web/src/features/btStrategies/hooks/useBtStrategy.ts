import { UseQueryResult, useQuery } from '@tanstack/react-query';
import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { isNotNil } from 'ramda';
import { useContext } from 'react';

import { InfraContext } from '#infra/InfraProvider.context';
import { GeneralError, createGeneralError } from '#shared/errors/generalError';
import { executeTeToPromise } from '#shared/utils/fp';

import { BtStrategy } from '../btStrategy';
import { GetBtStrategyByIdError } from '../btStrategy.repository';

const STALE_TIME = 60_000 * 5;

export default function useBtStrategy(
  autoFetchEnabled: boolean,
  btStrategyId?: string,
): UseQueryResult<BtStrategy, GetBtStrategyByIdError | GeneralError<'InvalidInput'>> {
  const { btStrategyRepo } = useContext(InfraContext);

  return useQuery({
    enabled: autoFetchEnabled && isNotNil(btStrategyId),
    staleTime: STALE_TIME,
    queryKey: isNotNil(btStrategyId) ? ['btStrategy', btStrategyId] : undefined,
    queryFn: () =>
      pipe(
        isNotNil(btStrategyId)
          ? te.right(btStrategyId)
          : te.left(createGeneralError('InvalidInput', 'Backtesting strategy ID is required')),
        te.chainW(btStrategyRepo.getBtStrategyById),
        executeTeToPromise,
      ),
  });
}
