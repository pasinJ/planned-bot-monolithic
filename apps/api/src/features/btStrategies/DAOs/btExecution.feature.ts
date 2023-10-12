import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { isNotNil } from 'ramda';

import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { BtExecutionProgress } from '../dataModels/btExecution.js';
import { btJobName } from '../executeBtStrategy/backtesting.job.js';
import { BtExecutionDaoError, createBtExecutionDaoError } from './btExecution.error.js';
import { BtExecutionMongooseModel } from './btExecution.js';

export type GetBtExecutionProgressById = (
  id: string,
) => te.TaskEither<GetBtExecutionProgressIdError, BtExecutionProgress>;
export type GetBtExecutionProgressIdError = BtExecutionDaoError<'GetProgressByIdFailed' | 'NotExist'>;
export function getBtExecutionProgressById({
  mongooseModel,
}: {
  mongooseModel: BtExecutionMongooseModel;
}): GetBtExecutionProgressById {
  return (id) =>
    pipe(
      te.tryCatch(
        () => mongooseModel.findOne({ name: btJobName, 'data.id': id }).lean(),
        createErrorFromUnknown(
          createBtExecutionDaoError(
            'GetProgressByIdFailed',
            'Getting backtesting execution progress by ID failed',
          ),
        ),
      ),
      te.chainW(
        te.fromPredicate(isNotNil, () =>
          createBtExecutionDaoError('NotExist', `Backtesting execution ID (${id}) does not exist`),
        ),
      ),
      te.map((btExecution) => ({ ...btExecution.data, logs: btExecution.result?.logs ?? [] })),
    );
}
