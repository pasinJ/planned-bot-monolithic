import { differenceInMilliseconds } from 'date-fns';
import { utcToZonedTime as utcToZonedTimeBase } from 'date-fns-tz';
import { z } from 'zod';

import { TimezoneString } from './string.js';

export type ValidDate = z.infer<typeof validDateSchema>;
export const validDateSchema = z.date().brand('ValidDate');

export type Milliseconds = number & z.BRAND<'Milliseconds'>;

export type UnixMs = z.infer<typeof unixMsSchema>;
export const unixMsSchema = z.number().int().brand('UnixMs');

export type Day = Range<1, 32> & z.BRAND<'Day'>;
export const daySchema = z.number().int().min(1).max(31).brand('Day');

export type DayString = `0${Range<1, 10>}` | (`${Range<10, 32>}` & z.BRAND<'DayString'>);

export type Month = Range<1, 13> & z.BRAND<'Month'>;
export const monthSchema = z.number().int().min(1).max(12).brand('Month');

export type MonthString = `0${Range<1, 10>}` | (`${Range<10, 13>}` & z.BRAND<'MonthString'>);

export type Year = number & z.BRAND<'Year'>;
export const yearSchema = z.number().int().min(0).brand('Year');

export type YearString = string & z.BRAND<'YearString'>;

export type WeekOfYear = Range<1, 54> & z.BRAND<'WeekOfYear'>;
export const weekOfYearSchema = z.number().int().min(0).max(53).brand('WeekOfYear');

export type Hour = Range<0, 24> & z.BRAND<'Hour'>;
export const hourSchema = z.number().int().min(0).max(23).brand('Hour');

export type Minute = Range<0, 60> & z.BRAND<'Minute'>;
export const minuteSchema = z.number().int().min(0).max(59).brand('Minute');

export type Second = Range<0, 60> & z.BRAND<'Second'>;
export const secondSchema = z.number().int().min(0).max(59).brand('Second');

export type DayOfWeekString =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

type Range<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>;
type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;

export type DateRange = Readonly<{ start: StartTimestamp; end: EndTimestamp }>;
type StartTimestamp = ValidDate & z.BRAND<'StartTimestamp'>;
type EndTimestamp = ValidDate & z.BRAND<'EndTimestamp'>;

export function utcToZonedTime(timezone: TimezoneString) {
  return (date: ValidDate): ValidDate => utcToZonedTimeBase(date, timezone) as ValidDate;
}

export function getDiffInMs(before: Date, after: Date): Milliseconds {
  return differenceInMilliseconds(before, after) as Milliseconds;
}
