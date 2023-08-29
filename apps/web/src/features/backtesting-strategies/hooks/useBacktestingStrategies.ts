import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#utils/fp';

import { BacktestingStrategy } from '../domain/backtestingStrategy.entity';
import { getBacktestingStrategies } from '../repositories/backtestingStrategy';
import { GetBacktestingStrategiesError } from '../repositories/backtestingStrategy.type';

export default function useBacktestingStrategies(
  enabled: boolean,
): UseQueryResult<readonly BacktestingStrategy[], GetBacktestingStrategiesError> {
  const { httpClient } = useContext(InfraContext);

  return useQuery<readonly BacktestingStrategy[], GetBacktestingStrategiesError>({
    queryKey: ['portfolios'],
    queryFn: () => executeTeToPromise(getBacktestingStrategies({ httpClient })),
    enabled,
  });
}
