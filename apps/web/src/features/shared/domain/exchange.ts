import { z } from 'zod';

export const exchangeSchema = z.enum(['BINANCE']);
export type Exchange = z.infer<typeof exchangeSchema>;
export const exchangeEnum = exchangeSchema.enum;
