import { z } from 'zod';

import { portfolioSchema } from '../domain/portfolio.entity';

export const API_ENDPOINTS = {
  GET_PORTFOLIOS: { method: 'GET', url: '/api/v1/portfolios', responseSchema: z.array(portfolioSchema) },
  CREATE_PORTFOLIO: { method: 'POST', url: '/api/v1/portfolios', responseSchema: portfolioSchema },
} as const;
