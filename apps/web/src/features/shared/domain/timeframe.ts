import { z } from 'zod';

export type Timeframe = z.infer<typeof timeframeSchema>;
export const timeframeSchema = z.enum([
  '1s',
  '1m',
  '3m',
  '5m',
  '15m',
  '30m',
  '1h',
  '2h',
  '4h',
  '6h',
  '8h',
  '12h',
  '1d',
  '3d',
  '1w',
  '1M',
]);
export const timeframeEnum = timeframeSchema.enum;
