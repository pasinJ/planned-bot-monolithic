import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#utils/fp';

import { BacktestingStrategy } from '../domain/backtestingStrategy.entity';
import { getBtStrategies } from '../repositories/backtestingStrategy';
import { GetBtStrategiesError } from '../repositories/backtestingStrategy.type';

export default function useBtStrategies(
  enabled: boolean,
): UseQueryResult<readonly BacktestingStrategy[], GetBtStrategiesError> {
  const { httpClient } = useContext(InfraContext);

  return useQuery<readonly BacktestingStrategy[], GetBtStrategiesError>({
    queryKey: ['portfolios'],
    queryFn: () => executeTeToPromise(getBtStrategies({ httpClient })),
    enabled,
  });
}
