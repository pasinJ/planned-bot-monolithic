import { utcToZonedTime as _utcToZonedTime } from 'date-fns-tz';
import { z } from 'zod';

import { TimezoneString } from './string';
import { schemaForType } from './zod';

export type ValidDate = Date & z.BRAND<'ValidDate'>;
export const validDateSchema = schemaForType<ValidDate>().with(z.date().brand('ValidDate'));

export type ZonedDate = ValidDate & z.BRAND<'ZonedDate'>;
export type OffsetDate = ValidDate & z.BRAND<'OffsetDate'>;

export function utcToZonedTime(date: ValidDate, timezone: TimezoneString): ZonedDate {
  return _utcToZonedTime(date, timezone) as ZonedDate;
}

export function applyTimezoneOffsetToUnix(
  dateInAnyTimezone: ValidDate,
  targetTimezone: TimezoneString,
): OffsetDate {
  const zonedDate = utcToZonedTime(dateInAnyTimezone, targetTimezone);
  return new Date(
    Date.UTC(
      zonedDate.getFullYear(),
      zonedDate.getMonth(),
      zonedDate.getDate(),
      zonedDate.getHours(),
      zonedDate.getMinutes(),
      zonedDate.getSeconds(),
      zonedDate.getMilliseconds(),
    ),
  ) as OffsetDate;
}
