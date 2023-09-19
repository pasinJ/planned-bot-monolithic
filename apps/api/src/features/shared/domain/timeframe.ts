import { z } from 'zod';

export type Timeframe = z.infer<typeof timeframeSchema>;
export const timeframeSchema = z.enum([
  '1s', // 86_400 | 2_592_000    => Month + Daily + API
  '1m', // 1_440  | 43_200       => Month + Daily + API
  '3m', // 480    | 14_400       => Month + Daily + API
  '5m', // 288    | 8_640        => Month + API
  '15m', // 96     | 2_880        => Month + API
  '30m', // 48     | 1_440        => Month + API
  '1h', // 24     | 720          => Month + API
  '2h', // 12     | 360          => Month + API
  '4h', // 6      | 180          => Month + API
  '6h', // 4      | 120          => API
  '8h', // 3      | 90           => API
  '12h', // 2      | 60           => API
  '1d', // 1      | 30           => API
  '3d', //                       => API
  '1w', //                       => API
  '1M', //                       => API
]);
export const timeframeEnum = timeframeSchema.enum;
export const timeframeList = timeframeSchema.options;

// calculate X number of klines from range and timeframe
//    (API)       = X / 10000
//    (Monthly)   = each month of interval
//    (Daily)     = each day of interval
