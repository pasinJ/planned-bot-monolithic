import { format, getWeek } from 'date-fns';
import io from 'fp-ts/lib/IO.js';
import { pipe } from 'fp-ts/lib/function.js';
import { DeepReadonly } from 'ts-essentials';

import { DateService } from '#infra/services/date/service.js';
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
  utcToZonedTime,
} from '#shared/utils/date.js';
import { TimezoneString } from '#shared/utils/string.js';

export type SystemModule = {
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

export type SystemModuleDeps = DeepReadonly<{ dateService: DateService }>;

export function buildSystemModule(deps: SystemModuleDeps, timezone: TimezoneString): SystemModule {
  const { dateService } = deps;
  const getClientLocalDate = pipe(dateService.getCurrentDate, io.map(utcToZonedTime(timezone)));

  return {
    getDate: getClientLocalDate,
    getUnixMsTime: pipe(
      getClientLocalDate,
      io.map((clientLocalDate) => clientLocalDate.getTime() as UnixMs),
    ),
    getDay: pipe(
      getClientLocalDate,
      io.map((clientLocalDate) => clientLocalDate.getDate() as Day),
    ),
    getMonth: pipe(
      getClientLocalDate,
      io.map((clientLocalDate) => clientLocalDate.getMonth() as Month),
    ),
    getYear: pipe(
      getClientLocalDate,
      io.map((clientLocalDate) => clientLocalDate.getFullYear() as Year),
    ),
    getHours: pipe(
      getClientLocalDate,
      io.map((clientLocalDate) => clientLocalDate.getHours() as Hour),
    ),
    getMinutes: pipe(
      getClientLocalDate,
      io.map((clientLocalDate) => clientLocalDate.getMinutes() as Minute),
    ),
    getSeconds: pipe(
      getClientLocalDate,
      io.map((clientLocalDate) => clientLocalDate.getSeconds() as Second),
    ),
    getDayOfWeek: pipe(
      getClientLocalDate,
      io.map((clientLocalDate) => format(clientLocalDate, 'eeee') as DayOfWeekString),
    ),
    getWeekOfYear: pipe(
      getClientLocalDate,
      io.map((clientLocalDate) => getWeek(clientLocalDate) as WeekOfYear),
    ),
  };
}
