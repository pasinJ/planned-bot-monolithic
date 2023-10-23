import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { values } from 'ramda';
import { useContext } from 'react';

import { ExchangeName } from '#features/exchanges/exchange';
import { SymbolName } from '#features/symbols/symbol';
import { InfraContext } from '#infra/InfraProvider.context';
import { ValidDate } from '#shared/utils/date';
import { executeTeToPromise } from '#shared/utils/fp';

import { Kline, Timeframe } from '../kline';
import { GetKlinesError } from '../kline.repository';

const klinesQueryKey = ['klines'];
const staleTimeMs = Infinity;

export type UseKlinesRequest = {
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  startTimestamp: ValidDate;
  endTimestamp: ValidDate;
};
export default function useKlines(
  request: UseKlinesRequest,
  autoFetchEnabled: boolean,
): UseQueryResult<readonly Kline[], GetKlinesError> {
  const { klineRepo } = useContext(InfraContext);

  return useQuery<readonly Kline[], GetKlinesError>({
    queryKey: [...klinesQueryKey, ...values(request)],
    queryFn: () => executeTeToPromise(klineRepo.getKlines(request)),
    staleTime: staleTimeMs,
    enabled: autoFetchEnabled,
  });
}
