import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#utils/fp';

import { BtStrategy } from '../domain/btStrategy.entity';
import { getBtStrategies } from '../repositories/btStrategy';
import { GetBtStrategiesError } from '../repositories/btStrategy.type';

export default function useBtStrategies(
  enabled: boolean,
): UseQueryResult<readonly BtStrategy[], GetBtStrategiesError> {
  const { httpClient } = useContext(InfraContext);

  return useQuery<readonly BtStrategy[], GetBtStrategiesError>({
    queryKey: ['portfolios'],
    queryFn: () => executeTeToPromise(getBtStrategies({ httpClient })),
    enabled,
  });
}