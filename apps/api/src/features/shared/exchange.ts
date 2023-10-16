import { z } from 'zod';

export type { ExchangeName } from '#SECT/Exchange.js';

export const exchangeNameSchema = z.enum(['BINANCE']);
export const exchangeNameEnum = exchangeNameSchema.enum;
export const exchangeNameList = exchangeNameSchema.options;
