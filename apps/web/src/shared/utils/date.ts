import { isAfter, isBefore, isEqual } from 'date-fns';
import { utcToZonedTime as _utcToZonedTime } from 'date-fns-tz';
import * as e from 'fp-ts/lib/Either';
import { z } from 'zod';

import { GeneralError, createGeneralError } from '#shared/errors/generalError';

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

export function isBeforeOrEqual(date: Date | number, dateToCompare: Date | number) {
  return isBefore(date, dateToCompare) || isEqual(date, dateToCompare);
}
export function isAfterOrEqual(date: Date | number, dateToCompare: Date | number) {
  return isAfter(date, dateToCompare) || isEqual(date, dateToCompare);
}

export type DateRange = { start: ValidDate; end: ValidDate } & z.BRAND<'DateRange'>;
export function createDateRange(
  start: ValidDate,
  end: ValidDate,
): e.Either<GeneralError<'DateRangeInvalid'>, DateRange> {
  return isBeforeOrEqual(start, end)
    ? e.right({ start, end } as DateRange)
    : e.left(createGeneralError('DateRangeInvalid', 'The given start and end date is not a date range'));
}
