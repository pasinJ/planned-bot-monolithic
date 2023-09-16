import { z } from 'zod';

export type ExchangeName = z.infer<typeof exchangeNameSchema>;
export const exchangeNameSchema = z.enum(['BINANCE']);
export const exchangeNameEnum = exchangeNameSchema.enum;
export const exchangeNameList = exchangeNameSchema.options;
