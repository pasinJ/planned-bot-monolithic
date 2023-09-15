import { JobScheduler } from '#infra/services/jobScheduler/service.type.js';

import { scheduleBtJob } from '../executeBtStrategy/backtesting.job.js';
import { ScheduleBtJob } from '../executeBtStrategy/backtesting.job.type.js';

export type BtJobScheduler = { scheduleBtJob: ScheduleBtJob };

export function buildBtJobScheduler(jobScheduler: JobScheduler): BtJobScheduler {
  return { scheduleBtJob: scheduleBtJob(jobScheduler.agenda) };
}
