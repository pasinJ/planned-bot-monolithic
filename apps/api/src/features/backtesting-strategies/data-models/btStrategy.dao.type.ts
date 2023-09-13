import io from 'fp-ts/lib/IO.js';
import te from 'fp-ts/lib/TaskEither.js';

import { BtStrategyModelDaoError } from './btStrategy.dao.error.js';
import { BtStrategyId, BtStrategyModel } from './btStrategy.model.js';

export type BtStrategyModelDao = {
  generateId: io.IO<BtStrategyId>;
  add: (btStrategy: BtStrategyModel) => te.TaskEither<BtStrategyModelDaoError<'AddFailed'>, void>;
  existById: (id: string) => te.TaskEither<BtStrategyModelDaoError<'ExistByIdFailed'>, boolean>;
};
