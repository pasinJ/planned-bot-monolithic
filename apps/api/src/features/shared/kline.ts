import {
  differenceInMilliseconds,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  getTime,
  isAfter,
  isBefore,
  isEqual,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Decimal } from 'decimal.js';
import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { z } from 'zod';

import type { Kline } from '#SECT/Kline.js';
import { ValidDate } from '#SECT/date.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { isAfterOrEqual, isBeforeOrEqual } from '#shared/utils/date.js';
import { nonNegativeFloat8DigitsSchema } from '#shared/utils/number.js';
import { validateWithZod } from '#shared/utils/zod.js';

import { ExchangeName } from './exchange.js';
import { DateRange } from './objectValues/dateRange.js';
import { SymbolName } from './symbol.js';
import { Timeframe } from './timeframe.js';

export type { Kline, Price, Volume, NumTrades } from '#SECT/Kline.js';

const priceSchema = nonNegativeFloat8DigitsSchema.brand('Price');
const volumeSchema = nonNegativeFloat8DigitsSchema.brand('Volume');
const numTradesSchema = z.number().nonnegative().int().brand('NumTrades');

export function createKline(data: {
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  openTimestamp: number;
  closeTimestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteAssetVolume: number;
  takerBuyBaseAssetVolume: number;
  takerBuyQuoteAssetVolume: number;
  numTrades: number;
}): e.Either<GeneralError<'CreateKlineFailed'>, Kline> {
  const klineModelSchema = z
    .object({
      exchange: z.any(),
      symbol: z.any(),
      timeframe: z.any(),
      openTimestamp: z.number().int().pipe(z.coerce.date()),
      closeTimestamp: z.number().int().pipe(z.coerce.date()),
      open: priceSchema,
      close: priceSchema,
      high: priceSchema,
      low: priceSchema,
      volume: volumeSchema,
      quoteAssetVolume: volumeSchema,
      takerBuyBaseAssetVolume: volumeSchema,
      takerBuyQuoteAssetVolume: volumeSchema,
      numTrades: numTradesSchema,
    })
    .strict()
    .refine(
      ({ openTimestamp, closeTimestamp }) => isBefore(openTimestamp, closeTimestamp),
      ({ openTimestamp, closeTimestamp }) => ({
        message: `close timestamp (${closeTimestamp.toISOString()}) must be after open timestamp (${openTimestamp.toISOString()})`,
        path: ['closeTimestamp'],
      }),
    );

  return pipe(
    validateWithZod(klineModelSchema, 'Validating kline schema failed', data),
    e.bimap(
      (error) =>
        createGeneralError(
          'CreateKlineFailed',
          'Creating a new kline failed because the given data is invalid',
          error,
        ),
      (kline) => kline as Kline,
    ),
  );
}

const timeframeMsPeriod = {
  '1s': 1000,
  '1m': 60_000,
  '3m': 60_000 * 3,
  '5m': 60_000 * 5,
  '15m': 60_000 * 15,
  '30m': 60_000 * 30,
  '1h': 60_000 * 60,
  '2h': 60_000 * 60 * 2,
  '4h': 60_000 * 60 * 4,
  '6h': 60_000 * 60 * 6,
  '8h': 60_000 * 60 * 8,
  '12h': 60_000 * 60 * 12,
  '1d': 60_000 * 60 * 24,
  '3d': 60_000 * 60 * 24 * 3,
};

export function calculateNumOfKlinesInDateRange(dateRange: DateRange, timeframe: Timeframe): number {
  const endOfFirstKline = convertDateToEndOfTimeframe(dateRange.start, timeframe);

  if (isAfter(endOfFirstKline, dateRange.end)) return 0;
  else if (isEqual(endOfFirstKline, dateRange.end)) return 1;
  else if (timeframe === '1w') {
    return eachWeekOfInterval({ start: endOfFirstKline, end: dateRange.end }, { weekStartsOn: 1 }).reduce(
      (numOfKlines, startOfWeek) =>
        isAfterOrEqual(startOfWeek, endOfFirstKline) && isBeforeOrEqual(startOfWeek, dateRange.end)
          ? numOfKlines + 1
          : numOfKlines,
      0,
    );
  } else if (timeframe === '1M') {
    return eachMonthOfInterval({ start: endOfFirstKline, end: dateRange.end }).reduce(
      (numOfKlines, startOfMonth) =>
        isAfterOrEqual(startOfMonth, endOfFirstKline) && isBeforeOrEqual(startOfMonth, dateRange.end)
          ? numOfKlines + 1
          : numOfKlines,
      0,
    );
  } else {
    const spaceToEndRange = differenceInMilliseconds(dateRange.end, endOfFirstKline);
    const numOfKlines = new Decimal(spaceToEndRange)
      .dividedToIntegerBy(timeframeMsPeriod[timeframe])
      .plus(1)
      .toNumber();

    return numOfKlines;
  }
}
export function convertDateToStartOfTimeframe(date: ValidDate, timeframe: Timeframe): ValidDate {
  return (
    timeframe === '1M'
      ? startOfMonth(date)
      : timeframe === '1w'
      ? startOfWeek(date, { weekStartsOn: 1 })
      : timeframe === '3d'
      ? new Date(
          new Decimal(getTime(date))
            .minus(timeframeMsPeriod['1d'])
            .toNearest(timeframeMsPeriod[timeframe], Decimal.ROUND_FLOOR)
            .plus(timeframeMsPeriod['1d'])
            .toNumber(),
        )
      : new Date(
          new Decimal(getTime(date)).toNearest(timeframeMsPeriod[timeframe], Decimal.ROUND_FLOOR).toNumber(),
        )
  ) as ValidDate;
}
export function convertDateToEndOfTimeframe(date: ValidDate, timeframe: Timeframe): ValidDate {
  return (
    timeframe === '1M'
      ? endOfMonth(date)
      : timeframe === '1w'
      ? endOfWeek(date, { weekStartsOn: 1 })
      : new Date(
          new Decimal(getTime(convertDateToStartOfTimeframe(date, timeframe)))
            .plus(timeframeMsPeriod[timeframe])
            .minus(1)
            .toNumber(),
        )
  ) as ValidDate;
}
