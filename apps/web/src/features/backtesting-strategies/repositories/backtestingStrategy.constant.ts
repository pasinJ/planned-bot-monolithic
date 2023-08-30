import { z } from 'zod';

import { stringDatetimeToDate } from '#utils/common.type';

import { backtestingStrategySchema } from '../domain/backtestingStrategy.entity';

export const API_ENDPOINTS = {
  GET_BACKTESTING_STRATEGIES: {
    method: 'GET',
    url: '/api/v1/backtesting-strategies',
    responseSchema: z.array(backtestingStrategySchema),
  },
  CREATE_BACKTESTING_STRATEGY: {
    method: 'POST',
    url: '/api/v1/backtesting-strategies',
    responseSchema: z
      .object({
        startTimestamp: stringDatetimeToDate,
        endTimestamp: stringDatetimeToDate,
        createdAt: stringDatetimeToDate,
        updatedAt: stringDatetimeToDate,
      })
      .passthrough()
      .pipe(backtestingStrategySchema),
  },
} as const;
