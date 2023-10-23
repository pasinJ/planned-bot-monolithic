import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';

import { ExchangeName } from '#features/exchanges/domain/exchange';
import { SymbolName } from '#features/symbols/domain/symbol';
import { HttpClient } from '#infra/httpClient.type';
import { ValidDate } from '#shared/utils/date';

import { Kline, Timeframe } from './kline';
import { API_ENDPOINTS } from './kline.constant';
import { KlineRepoError, createKlineRepoError } from './kline.repository.error';

export type KlineRepo = { getKlines: GetKlines };
export function createKlineRepo({ httpClient }: { httpClient: HttpClient }): KlineRepo {
  return { getKlines: getKlines(httpClient) };
}

type GetKlines = (request: GetKlinesRequest) => te.TaskEither<GetKlinesError, readonly Kline[]>;
export type GetKlinesRequest = {
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  startTimestamp: ValidDate;
  endTimestamp: ValidDate;
};
export type GetKlinesError = KlineRepoError<'GetKlinesFailed'>;
function getKlines(httpClient: HttpClient): GetKlines {
  const { GET_KLINES } = API_ENDPOINTS;
  return (request) =>
    pipe(
      httpClient.sendRequest({ ...GET_KLINES, params: request }),
      te.mapLeft((error) =>
        createKlineRepoError('GetKlinesFailed', 'Getting klines from server failed', error),
      ),
    );
}
