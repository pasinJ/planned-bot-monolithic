import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#shared/utils/fp';

import { Symbol } from '../domain/symbol';
import { GetSymbolsError } from '../repositories/symbol';

const symbolsQueryKey = ['symbols'];
const symbolsStaleTimeMs = 5 * 60000;

export default function useSymbols(enabled: boolean): UseQueryResult<readonly Symbol[], GetSymbolsError> {
  const { symbolRepo } = useContext(InfraContext);

  return useQuery<readonly Symbol[], GetSymbolsError>({
    queryKey: symbolsQueryKey,
    queryFn: () => executeTeToPromise(symbolRepo.getSymbols),
    staleTime: symbolsStaleTimeMs,
    enabled,
  });
}
