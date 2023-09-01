import { z } from 'zod';

export const exchangeNameSchema = z.enum(['BINANCE']);
export const exchangeNameEnum = exchangeNameSchema.enum;
export type ExchangeName = z.infer<typeof exchangeNameSchema>;
