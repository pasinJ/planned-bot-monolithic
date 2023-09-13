import te from 'fp-ts/lib/TaskEither.js';

import { BtStrategyModelDaoError } from './btStrategy.dao.error.js';

export type BtStrategyModelDao = {
  existById: (id: string) => te.TaskEither<BtStrategyModelDaoError<'ExistByIdFailed'>, boolean>;
};
