import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#shared/utils/fp';

import { Symbol } from '../symbol';
import { GetSymbolsError } from '../symbol.repository';

const symbolsQueryKey = ['symbols'];
const staleTimeMs = 5 * 60000;

export default function useSymbols(
  autoFetchEnabled: boolean,
): UseQueryResult<readonly Symbol[], GetSymbolsError> {
  const { symbolRepo } = useContext(InfraContext);

  return useQuery<readonly Symbol[], GetSymbolsError>({
    queryKey: symbolsQueryKey,
    queryFn: () => executeTeToPromise(symbolRepo.getSymbols),
    staleTime: staleTimeMs,
    enabled: autoFetchEnabled,
  });
}
