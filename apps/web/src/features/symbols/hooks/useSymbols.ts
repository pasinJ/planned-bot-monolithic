import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#shared/utils/fp';

import { Symbol } from '../domain/symbol.valueObject';
import { SymbolRepoError } from '../repositories/symbol.error';

export default function useSymbols(
  enabled: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
): UseQueryResult<readonly Symbol[], SymbolRepoError<'GetSymbolsError'>> {
  const { symbolRepo } = useContext(InfraContext);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
  return useQuery<readonly Symbol[], SymbolRepoError<'GetSymbolsError'>>({
    queryKey: ['symbols'],
    queryFn: () => executeTeToPromise(symbolRepo.getSymbols),
    staleTime: 5 * 60000,
    enabled,
  });
}
