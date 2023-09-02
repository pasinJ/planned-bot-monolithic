import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';

import { HttpClient } from '#infra/httpClient.type';

import { API_ENDPOINTS } from './symbol.constant';
import { GetSymbolsError, SymbolRepo } from './symbol.type';

const { GET_SYMBOLS } = API_ENDPOINTS;

export function createSymbolRepo({ httpClient }: { httpClient: HttpClient }): SymbolRepo {
  return { getSymbols: getSymbols({ httpClient }) };
}

function getSymbols({ httpClient }: { httpClient: HttpClient }): SymbolRepo['getSymbols'] {
  const { method, url, responseSchema } = GET_SYMBOLS;
  return pipe(
    httpClient.sendRequest({ method, url, responseSchema }),
    te.mapLeft((error) => new GetSymbolsError().causedBy(error)),
  );
}
