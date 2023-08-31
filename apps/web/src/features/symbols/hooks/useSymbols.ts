import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#utils/fp';

import { Symbol } from '../domain/symbol.valueObject';
import { getSymbols } from '../repositories/symbol';
import { GetSymbolsError } from '../repositories/symbol.type';

export default function useSymbols(enabled: boolean): UseQueryResult<readonly Symbol[], GetSymbolsError> {
  const { httpClient } = useContext(InfraContext);

  return useQuery<readonly Symbol[], GetSymbolsError>({
    queryKey: ['symbols'],
    queryFn: () => executeTeToPromise(getSymbols({ httpClient })),
    staleTime: 5 * 60000,
    enabled,
  });
}
