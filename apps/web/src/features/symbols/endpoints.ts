import { z } from 'zod';

import { symbolSchema } from './symbol';

export const API_ENDPOINTS = {
  GET_SYMBOLS: { method: 'GET', url: '/v1/symbols', responseSchema: z.array(symbolSchema) },
} as const;
