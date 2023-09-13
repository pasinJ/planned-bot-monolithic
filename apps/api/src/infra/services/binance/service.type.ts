import te from 'fp-ts/lib/TaskEither.js';

import { SymbolModel } from '#features/symbols/data-models/symbol-model/index.js';

import { BnbServiceError } from './error.js';

export type BnbService = {
  getSpotSymbols: te.TaskEither<BnbServiceError<'GetSpotSymbolsFailed'>, readonly SymbolModel[]>;
};
