import { z } from 'zod';

import { symbolSchema } from '../domain/symbol.valueObject';

export const API_ENDPOINTS = {
  GET_SYMBOLS: {
    method: 'GET',
    url: '/api/v1/symbols',
    responseSchema: z.array(symbolSchema),
  },
} as const;
