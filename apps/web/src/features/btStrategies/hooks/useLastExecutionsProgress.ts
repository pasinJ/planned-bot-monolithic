import { UseQueryOptions, useQueries } from '@tanstack/react-query';
import { useContext } from 'react';

import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#shared/utils/fp';

import { BtStrategyId } from '../btStrategy';
import { GetExecutionProgressError, GetLastExecutionProgressResp } from '../btStrategy.repository';

export default function useLastExecutionsProgress(
  autoFetchEnabled: boolean,
  btStrategyIds: readonly BtStrategyId[],
) {
  const { btStrategyRepo } = useContext(InfraContext);

  return useQueries<UseQueryOptions<GetLastExecutionProgressResp, GetExecutionProgressError>[]>({
    queries: btStrategyIds.map((btStrategyId) => ({
      enabled: autoFetchEnabled,
      queryKey: ['executionProgress', btStrategyId],
      queryFn: () => executeTeToPromise(btStrategyRepo.getLastExecutionProgress(btStrategyId)),
      refetchInterval: (data) => (data?.status === 'PENDING' || data?.status === 'RUNNING' ? 1000 : false),
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    })),
  });
}
