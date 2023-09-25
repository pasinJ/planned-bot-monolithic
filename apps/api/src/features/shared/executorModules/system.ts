import { format, getWeek } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { ReadonlyNonEmptyArray, last } from 'fp-ts/lib/ReadonlyNonEmptyArray.js';

import { KlineModel } from '#features/btStrategies/dataModels/kline.js';
import {
  Day,
  DayOfWeekString,
  Hour,
  Minute,
  Month,
  Second,
  UnixMs,
  ValidDate,
  WeekOfYear,
  Year,
} from '#shared/utils/date.js';
import { TimezoneString } from '#shared/utils/string.js';

export type SymtemModule = {
  // client timezone
  getDate: () => ValidDate;
  getUnixMsTime: () => UnixMs;
  getDay: () => Day;
  getMonth: () => Month;
  getYear: () => Year;
  getHours: () => Hour;
  getMinutes: () => Minute;
  getSeconds: () => Second;
  getDayOfWeek: () => DayOfWeekString;
  getWeekOfYear: () => WeekOfYear;
};

export function buildSymtemModule(
  timezone: TimezoneString,
  klines: ReadonlyNonEmptyArray<KlineModel>,
): SymtemModule {
  const lastKline = last(klines);
  const clientLocalTime = utcToZonedTime(lastKline.closeTimestamp, timezone) as ValidDate;

  return {
    getDate: () => clientLocalTime,
    getUnixMsTime: () => clientLocalTime.getTime() as UnixMs,
    getDay: () => clientLocalTime.getDate() as Day,
    getMonth: () => clientLocalTime.getMonth() as Month,
    getYear: () => clientLocalTime.getFullYear() as Year,
    getHours: () => clientLocalTime.getHours() as Hour,
    getMinutes: () => clientLocalTime.getMinutes() as Minute,
    getSeconds: () => clientLocalTime.getSeconds() as Second,
    getDayOfWeek: () => format(clientLocalTime, 'eeee') as DayOfWeekString,
    getWeekOfYear: () => getWeek(clientLocalTime) as WeekOfYear,
  };
}
