import te from 'fp-ts/lib/TaskEither.js';

import {
  BtExecutionId,
  BtExecutionStatus,
} from '#features/backtesting-strategies/data-models/btExecution.model.js';
import { BtStrategyId } from '#features/backtesting-strategies/data-models/btStrategy.model.js';
import type { JobSchedulerError } from '#infra/services/jobScheduler/service.error.js';
import type { JobRecord } from '#infra/services/jobScheduler/service.type.js';

export type BtJobRecord = JobRecord<BtJobName, BtJobData, BtJobResult>;

type BtJobName = typeof btJobName;
export const btJobName = 'backtesting';

export type BtJobData = { id: BtExecutionId; btStrategyId: BtStrategyId; status: BtExecutionStatus };

export type BtJobResult = { logs: string[] };

export const btJobErrorName = ['ScheduleBtJobFailed'] as const;

export type ScheduleBtJob = (
  btStrategyId: BtStrategyId,
) => te.TaskEither<
  JobSchedulerError<'ScheduleBtJobFailed' | 'ExceedJobMaxLimit'>,
  { id: BtExecutionId; createdAt: Date }
>;
