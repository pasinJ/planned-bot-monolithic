import io from 'fp-ts/lib/IO.js';
import te from 'fp-ts/lib/TaskEither.js';

import { BtStrategy, BtStrategyId } from '../domain/btStrategy.entity.js';
import { BtStrategyRepoError } from './btStrategy.error.js';

export type BtStrategyRepo = {
  generateId: io.IO<BtStrategyId>;
  add: (btStrategy: BtStrategy) => te.TaskEither<BtStrategyRepoError<'AddBtStrategyError'>, void>;
};
