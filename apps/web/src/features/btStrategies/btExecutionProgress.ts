import { DeepReadonly } from 'ts-essentials';

import { BtExecutionId, BtExecutionStatus, ExecutionLogs, ProgressPercentage } from './btExecution';
import { BtStrategyId } from './btStrategy';

export type BtExecutionProgress = DeepReadonly<{
  id: BtExecutionId;
  btStrategyId: BtStrategyId;
  status: BtExecutionStatus;
  percentage: ProgressPercentage;
  logs: ExecutionLogs;
}>;
