import { z } from 'zod';

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
    responseSchema: backtestingStrategySchema,
  },
} as const;
