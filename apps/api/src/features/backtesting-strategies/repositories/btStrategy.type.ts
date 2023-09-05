import te from 'fp-ts/lib/TaskEither.js';

import { BtStrategy } from '../domain/btStrategy.entity.js';
import { BtStrategyRepoError } from './btStrategy.error.js';

export type BtStrategyRepo = {
  add: (btStrategy: BtStrategy) => te.TaskEither<BtStrategyRepoError<'AddBtStrategyError'>, void>;
};
