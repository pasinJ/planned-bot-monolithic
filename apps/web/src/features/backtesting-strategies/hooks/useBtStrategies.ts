import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#shared/utils/fp';

import { BtStrategy } from '../domain/btStrategy.entity';
import { BtStrategyRepoError } from '../repositories/btStrategy.error';

export default function useBtStrategies(
  enabled: boolean,
): UseQueryResult<readonly BtStrategy[], BtStrategyRepoError<'GetStrategiesError'>> {
  const { btStrategyRepo } = useContext(InfraContext);

  return useQuery<readonly BtStrategy[], BtStrategyRepoError<'GetStrategiesError'>>({
    queryKey: ['portfolios'],
    queryFn: () => executeTeToPromise(btStrategyRepo.getBtStrategies),
    enabled,
  });
}
