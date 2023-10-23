import { z } from 'zod';

import { stringDatetimeToDate } from '#shared/common.type';

import { klineSchema } from './kline';

export const API_ENDPOINTS = {
  GET_KLINES: {
    method: 'GET',
    url: '/v1/klines',
    responseSchema: z.array(
      z
        .object({ openTimestamp: stringDatetimeToDate, closeTimestamp: stringDatetimeToDate })
        .passthrough()
        .pipe(klineSchema),
    ),
  },
} as const;
