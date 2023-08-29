import * as te from 'fp-ts/lib/TaskEither';

import { HttpClient, HttpError } from '#infra/httpClient.type';
import { ErrorBase } from '#utils/error';

import { Symbol } from '../domain/symbol.valueObject';

export type GetSymbols = (deps: GetSymbolsDeps) => te.TaskEither<GetSymbolsError, readonly Symbol[]>;
type GetSymbolsDeps = { httpClient: HttpClient };
export class GetSymbolsError extends ErrorBase<'GET_SYMBOLS_ERROR', HttpError> {}
