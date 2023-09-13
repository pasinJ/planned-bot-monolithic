import { Agenda } from 'agenda';
import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { equals, propSatisfies } from 'ramda';

import {
  BtExecutionId,
  BtExecutionStatus,
  btExecutionStatusEnum,
  generateBtExecutionId,
} from '#features/backtesting-strategies/data-models/btExecution.model.js';
import { BtStrategyId } from '#features/backtesting-strategies/data-models/btStrategy.model.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { createJobSchedulerError } from '../service.error.js';
import { JobRecord, JobScheduler } from '../service.type.js';

export type BtJobRecord = JobRecord<BtJobName, BtJobData>;

type BtJobName = typeof btJobName;
const btJobName = 'backtesting';

type BtJobData = { id: BtExecutionId; btStrategyId: BtStrategyId; status: BtExecutionStatus };

export function addBtJob(agenda: Agenda): JobScheduler['addBtJob'] {
  const { pending, running } = btExecutionStatusEnum;

  return (btStrategyId) =>
    pipe(
      te.tryCatch(
        () =>
          agenda.jobs({
            name: btJobName,
            'data.btStrategyId': btStrategyId,
            'data.status': { $in: [pending, running] },
          }),
        createErrorFromUnknown(
          createJobSchedulerError('AddBtJobFailed', 'Getting pending or running job failed'),
        ),
      ),
      te.chainFirstEitherKW(
        e.fromPredicate(propSatisfies(equals(0), 'length'), () =>
          createJobSchedulerError(
            'ExceedJobMaxLimit',
            'Backtesting job can be scheduled only one at a time per strategy',
          ),
        ),
      ),
      te.let('data', () => ({
        id: generateBtExecutionId(),
        btStrategyId,
        status: btExecutionStatusEnum.pending,
      })),
      te.chainFirstW(({ data }) =>
        te.tryCatch(
          () => agenda.now(btJobName, data),
          createErrorFromUnknown(
            createJobSchedulerError('AddBtJobFailed', 'Adding a backtesting job failed'),
          ),
        ),
      ),
      te.map(({ data }) => ({ id: data.id, createdAt: new Date() })),
    );
}
