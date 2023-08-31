import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';

import { API_ENDPOINTS } from './symbol.constant';
import { GetSymbols, GetSymbolsError } from './symbol.type';

const { GET_SYMBOLS } = API_ENDPOINTS;

export function getSymbols(...[{ httpClient }]: Parameters<GetSymbols>): ReturnType<GetSymbols> {
  const { method, url, responseSchema } = GET_SYMBOLS;
  return pipe(
    httpClient.sendRequest({ method, url, responseSchema }),
    te.mapLeft((error) => new GetSymbolsError().causedBy(error)),
  );
}
