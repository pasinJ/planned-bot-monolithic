import {
  BtExecutionId,
  BtExecutionStatus,
} from '#features/backtesting-strategies/data-models/btExecution.model.js';
import { BtStrategyId } from '#features/backtesting-strategies/data-models/btStrategy.model.js';

import { JobRecord } from '../../service.type.js';

export type BtJobRecord = JobRecord<BtJobName, BtJobData, BtJobResult>;

type BtJobName = typeof btJobName;
export const btJobName = 'backtesting';

export type BtJobData = { id: BtExecutionId; btStrategyId: BtStrategyId; status: BtExecutionStatus };
export type BtJobResult = { logs: string[] };
