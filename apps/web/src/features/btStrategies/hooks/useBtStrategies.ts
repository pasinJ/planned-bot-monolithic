import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#shared/utils/fp';

import { BtStrategy } from '../btStrategy';
import { BtStrategyRepoError } from '../btStrategy.repository.error';

export default function useBtStrategies(
  autoFetchEnabled: boolean,
): UseQueryResult<readonly BtStrategy[], BtStrategyRepoError<'GetBtStrategiesFailed'>> {
  const { btStrategyRepo } = useContext(InfraContext);

  return useQuery<readonly BtStrategy[], BtStrategyRepoError<'GetBtStrategiesFailed'>>({
    queryKey: ['btStrategies'],
    queryFn: () => executeTeToPromise(btStrategyRepo.getBtStrategies),
    enabled: autoFetchEnabled,
  });
}
