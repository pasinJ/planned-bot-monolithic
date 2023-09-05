import te from 'fp-ts/lib/TaskEither.js';

import { Symbol } from '#features/symbols/domain/symbol.entity.js';

import { BnbServiceError } from './error.js';

export type BnbService = {
  getSpotSymbols: te.TaskEither<BnbServiceError<'GetBnbSpotSymbolsError'>, readonly Symbol[]>;
};
