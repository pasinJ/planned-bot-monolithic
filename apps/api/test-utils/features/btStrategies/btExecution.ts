import { mergeRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import {
  BtExecutionId,
  BtExecutionProgress,
  BtExecutionProgressPercentage,
} from '#features/btStrategies/dataModels/btExecution.js';
import { BtStrategyId } from '#features/btStrategies/dataModels/btStrategy.js';

export function mockBtExecutionProgress(override?: DeepPartial<BtExecutionProgress>): BtExecutionProgress {
  return mergeRight<BtExecutionProgress, DeepPartial<BtExecutionProgress>>(
    {
      id: 'Uj3lV7cOB9' as BtExecutionId,
      btStrategyId: 'C-bEMMVKxv' as BtStrategyId,
      status: 'PENDING',
      percentage: 10 as BtExecutionProgressPercentage,
      logs: ['log1', 'log2', 'log3'],
    },
    override ?? {},
  ) as BtExecutionProgress;
}
