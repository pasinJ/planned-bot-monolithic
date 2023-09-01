import { z } from 'zod';

import { stringDatetimeToDate } from '#utils/common.type';

import { btStrategySchema } from '../domain/btStrategy.entity';

export const API_ENDPOINTS = {
  GET_BT_STRATEGIES: {
    method: 'GET',
    url: '/v1/backtesting-strategies',
    responseSchema: z.array(btStrategySchema),
  },
  ADD_BT_STRATEGY: {
    method: 'POST',
    url: '/v1/backtesting-strategies',
    responseSchema: z
      .object({
        startTimestamp: stringDatetimeToDate,
        endTimestamp: stringDatetimeToDate,
        createdAt: stringDatetimeToDate,
        updatedAt: stringDatetimeToDate,
      })
      .passthrough()
      .pipe(btStrategySchema),
  },
} as const;
