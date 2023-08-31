import { z } from 'zod';

export const exchangeNameSchema = z.enum(['BINANCE']);
export type ExchangeName = z.infer<typeof exchangeNameSchema>;
export const exchangeNameEnum = exchangeNameSchema.enum;
