import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';

import { HttpClient } from '#infra/httpClient.type';

import { Symbol } from './symbol';
import { API_ENDPOINTS } from './endpoints';
import { SymbolRepoError, createSymbolRepoError } from './symbol.repository.error';

export type SymbolRepo = { getSymbols: GetSymbols };
export function createSymbolRepo({ httpClient }: { httpClient: HttpClient }): SymbolRepo {
  return { getSymbols: getSymbols({ httpClient }) };
}

type GetSymbols = te.TaskEither<GetSymbolsError, readonly Symbol[]>;
export type GetSymbolsError = SymbolRepoError<'GetSymbolsFailed'>;
function getSymbols({ httpClient }: { httpClient: HttpClient }): GetSymbols {
  return pipe(
    httpClient.sendRequest({ ...API_ENDPOINTS.GET_SYMBOLS }),
    te.mapLeft((error) =>
      createSymbolRepoError('GetSymbolsFailed', 'Getting symbols from backend failed', error),
    ),
  );
}
