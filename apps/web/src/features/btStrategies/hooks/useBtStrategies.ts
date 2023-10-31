import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#shared/utils/fp';

import { BtStrategy } from '../btStrategy';
import { GetBtStrategiesError } from '../btStrategy.repository';

export default function useBtStrategies(
  autoFetchEnabled: boolean,
): UseQueryResult<readonly BtStrategy[], GetBtStrategiesError> {
  const { btStrategyRepo } = useContext(InfraContext);

  return useQuery<readonly BtStrategy[], GetBtStrategiesError>({
    queryKey: ['btStrategies'],
    queryFn: () => executeTeToPromise(btStrategyRepo.getBtStrategies),
    enabled: autoFetchEnabled,
  });
}
