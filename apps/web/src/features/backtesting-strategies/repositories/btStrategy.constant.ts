import { z } from 'zod';

import { stringDatetimeToDate } from '#utils/common.type';

import { btStrategySchema } from '../domain/btStrategy.entity';

const transformBtStrategy = z
  .object({
    startTimestamp: stringDatetimeToDate,
    endTimestamp: stringDatetimeToDate,
    createdAt: stringDatetimeToDate,
    updatedAt: stringDatetimeToDate,
  })
  .passthrough()
  .pipe(btStrategySchema);

export const API_ENDPOINTS = {
  GET_BT_STRATEGIES: {
    method: 'GET',
    url: '/v1/backtesting-strategies',
    responseSchema: z.array(transformBtStrategy),
  },
  ADD_BT_STRATEGY: {
    method: 'POST',
    url: '/v1/backtesting-strategies',
    responseSchema: transformBtStrategy,
  },
} as const;
