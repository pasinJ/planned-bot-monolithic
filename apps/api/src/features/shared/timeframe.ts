import { z } from 'zod';

export type Timeframe = z.infer<typeof timeframeSchema>;
export const timeframeSchema = z.enum([
  '1s', // 86_400 | 2_592_000
  '1m', // 1_440  | 43_200
  '3m', // 480    | 14_400
  '5m', // 288    | 8_640
  '15m', // 96     | 2_880
  '30m', // 48     | 1_440
  '1h', // 24     | 720
  '2h', // 12     | 360
  '4h', // 6      | 180
  '6h', // 4      | 120
  '8h', // 3      | 90
  '12h', // 2      | 60
  '1d', // 1      | 30
  '3d', //
  '1w', //
  '1M', //
]);
export const timeframeEnum = timeframeSchema.enum;
export const timeframeList = timeframeSchema.options;
