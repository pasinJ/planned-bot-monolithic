import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { isNotNil } from 'ramda';

import { createErrorFromUnknown } from '#shared/errors/appError.js';
import { getDiffInMs } from '#shared/utils/date.js';

import {
  BtExecutionFailedResult,
  BtExecutionProgress,
  BtExecutionResult,
  BtExecutionSuccessfulResult,
} from '../dataModels/btExecution.js';
import { BtJobDocument, BtJobResult, btJobName } from '../executeBtStrategy/backtesting.job.js';
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

export type GetBtExecutionResultById = (
  id: string,
) => te.TaskEither<GetBtExecutionResultByIdError, BtExecutionResult>;
export type GetBtExecutionResultByIdError = BtExecutionDaoError<
  'GetResultByIdFailed' | 'NotExist' | 'InvalidStatus'
>;
export function getBtExecutionResultById({
  mongooseModel,
}: {
  mongooseModel: BtExecutionMongooseModel;
}): GetBtExecutionResultById {
  return (id) => {
    const executionExist = te.fromPredicate(isNotNil, () =>
      createBtExecutionDaoError('NotExist', `Backtesting execution ID (${id}) does not exist`),
    );
    const executionIsNotPendingOrRunning = te.fromPredicate(
      (btExecution: BtJobDocument) =>
        btExecution.data.status !== 'PENDING' && btExecution.data.status !== 'RUNNING',
      () => createBtExecutionDaoError('InvalidStatus', `Backtesting execution has PENDING or RUNNING status`),
    );

    return pipe(
      te.tryCatch(
        () => mongooseModel.findOne({ name: btJobName, 'data.id': id }).lean(),
        createErrorFromUnknown(
          createBtExecutionDaoError(
            'GetResultByIdFailed',
            'Getting backtesting execution result by ID failed',
          ),
        ),
      ),
      te.chainW(executionExist),
      te.chainW(executionIsNotPendingOrRunning),
      te.map((btExecution) => {
        const { data, lastFinishedAt, lastRunAt } = btExecution;

        const executionTimeMs = lastFinishedAt && lastRunAt ? getDiffInMs(lastFinishedAt, lastRunAt) : 0;

        if (data.status === 'FINISHED') {
          const result = btExecution.result as BtJobResult<'FINISHED'>;
          return {
            id: data.id,
            status: data.status,
            executionTimeMs,
            ...result,
          } as BtExecutionSuccessfulResult;
        } else {
          const result = btExecution.result as BtJobResult<'TIMEOUT' | 'INTERUPTED' | 'CANCELED' | 'FAILED'>;
          return { id: data.id, status: data.status, executionTimeMs, ...result } as BtExecutionFailedResult;
        }
      }),
    );
  };
}
