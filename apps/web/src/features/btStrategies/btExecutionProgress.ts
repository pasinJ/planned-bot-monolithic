import { DeepReadonly } from 'ts-essentials';

import { BtExecutionStatus, ExecutionLogs, ProgressPercentage } from './btExecution';

export type BtExecutionProgress = DeepReadonly<{
  status: BtExecutionStatus;
  percentage: ProgressPercentage;
  logs: ExecutionLogs;
}>;
