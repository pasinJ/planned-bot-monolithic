import te from 'fp-ts/lib/TaskEither.js';

import { BtExecutionProgress } from '../dataModels/btExecution.js';
import { BtExecutionDaoError } from './btExecution.error.js';

export type GetBtExecutionProgressById = (
  id: string,
) => te.TaskEither<GetBtExecutionProgressIdError, BtExecutionProgress>;
export type GetBtExecutionProgressIdError = BtExecutionDaoError<'GetProgressByIdFailed' | 'NotExist'>;
