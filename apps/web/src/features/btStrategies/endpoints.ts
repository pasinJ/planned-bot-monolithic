import { z } from 'zod';

import { stringDatetimeToDate } from '#shared/common.type';

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
} as const;
