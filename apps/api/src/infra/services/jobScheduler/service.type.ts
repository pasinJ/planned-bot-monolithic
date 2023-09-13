import te from 'fp-ts/lib/TaskEither.js';

import { BtExecutionId } from '#features/backtesting-strategies/data-models/btExecution.model.js';
import { BtStrategyId } from '#features/backtesting-strategies/domain/btStrategy.entity.js';

import { JobSchedulerError } from './service.error.js';

export type JobScheduler = {
  stop: te.TaskEither<JobSchedulerError<'StopServiceFailed'>, void>;
  addBtJob: (
    btStrategyId: BtStrategyId,
  ) => te.TaskEither<
    JobSchedulerError<'AddBtJobFailed' | 'ExceedJobMaxLimit'>,
    { id: BtExecutionId; createdAt: Date }
  >;
};

export type JobRecord<
  Name extends string = string,
  Data extends Record<string, unknown> = Record<string, unknown>,
  Result = unknown,
> = {
  _id: string;
  name: Name;
  data: Data;
  priority: 20 | 10 | 0 | -10 | -20 | string;
  type: 'single' | 'normal';
  disabled?: boolean;
  shouldSaveResult?: boolean;
  result?: Result;
  nextRunAt?: Date;
  lockedAt?: Date;
  lastRunAt?: Date;
  lastFinishedAt?: Date;
  failReason?: string;
  failCount?: number;
  failedAt?: Date;
  lastModifiedBy?: string;
  __v: number;
};
