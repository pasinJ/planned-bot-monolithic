import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#utils/fpExecute';

import { Portfolio } from '../domain/portfolio.entity';
import { getPortfolios } from '../repositories/portfolioRepository';
import { GetPortfoliosError } from '../repositories/portfolioRepository.type';

export default function usePortfolios(enabled: boolean): UseQueryResult<Portfolio[], GetPortfoliosError> {
  const { httpClient } = useContext(InfraContext);

  return useQuery<Portfolio[], GetPortfoliosError>({
    queryKey: ['portfolios'],
    queryFn: () => executeTeToPromise(getPortfolios({ httpClient })),
    enabled,
  });
}
