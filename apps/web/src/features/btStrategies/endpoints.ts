import { z } from 'zod';

import { stringDatetimeToDate } from '#shared/common.type';

import { btExecutionId } from './btExecution';
import { btStrategyIdSchema, btStrategySchema } from './btStrategy';

export const API_ENDPOINTS = {
  GET_BT_STRATEGIES: {
    method: 'GET',
    url: '/v1/backtesting-strategies',
    responseSchema: z.array(
      z
        .object({
          startTimestamp: stringDatetimeToDate,
          endTimestamp: stringDatetimeToDate,
          createdAt: stringDatetimeToDate,
          updatedAt: stringDatetimeToDate,
        })
        .passthrough()
        .pipe(btStrategySchema),
    ),
  },
  ADD_BT_STRATEGY: {
    method: 'POST',
    url: '/v1/backtesting-strategies',
    responseSchema: z.object({ id: btStrategyIdSchema, createdAt: stringDatetimeToDate }),
  },
  UPDATE_BT_STRATEGY: { method: 'PUT', url: '/v1/backtesting-strategies/:id', responseSchema: z.any() },
  EXECUTE_BT_STRATEGY: {
    method: 'POST',
    url: '/v1/backtesting-strategies/:id/execute',
    responseSchema: z.object({ id: btExecutionId, createdAt: stringDatetimeToDate }),
  },
} as const;
