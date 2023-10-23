import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';

import { HttpClient } from '#infra/httpClient.type';

import { Symbol } from '../domain/symbol';
import { API_ENDPOINTS } from './symbol.constant';
import { SymbolRepoError, createSymbolRepoError } from './symbol.error';

const { GET_SYMBOLS } = API_ENDPOINTS;

export type SymbolRepo = { getSymbols: GetSymbols };
export function createSymbolRepo({ httpClient }: { httpClient: HttpClient }): SymbolRepo {
  return { getSymbols: getSymbols({ httpClient }) };
}

type GetSymbols = te.TaskEither<GetSymbolsError, readonly Symbol[]>;
export type GetSymbolsError = SymbolRepoError<'GetSymbolsError'>;
function getSymbols({ httpClient }: { httpClient: HttpClient }): GetSymbols {
  const { method, url, responseSchema } = GET_SYMBOLS;
  return pipe(
    httpClient.sendRequest({ method, url, responseSchema }),
    te.mapLeft((error) =>
      createSymbolRepoError('GetSymbolsError', 'Getting symbols from backend failed', error),
    ),
  );
}
