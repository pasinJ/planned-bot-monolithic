import { formatDuration, intervalToDuration, isBefore, isEqual } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { z } from 'zod';

import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { validDateSchema } from '#shared/utils/date.js';
import { validateWithZod } from '#shared/utils/zod.js';

export type DateRange = z.infer<typeof dateRangeSchema>;
export const dateRangeSchema = z
  .object({ start: validDateSchema, end: validDateSchema })
  .refine(
    ({ start, end }) => isBefore(start, end) || isEqual(start, end),
    `Start date must be before or equal to end date`,
  )
  .readonly()
  .brand('DateRage');

export type CreateDateRangeError = GeneralError<'CraeteDateRangeFailed'>;
export function createDateRange(startDate: Date, endDate: Date): e.Either<CreateDateRangeError, DateRange> {
  return pipe(
    validateWithZod(dateRangeSchema, 'Given data is invalid for date range', {
      start: startDate,
      end: endDate,
    }),
    e.mapLeft((error) => createGeneralError('CraeteDateRangeFailed', 'Creating date range failed', error)),
  );
}

export type DurationString = string & z.BRAND<'DurationString'>;
export function getDurationString(dateRate: DateRange): DurationString {
  return formatDuration(intervalToDuration(dateRate)) as DurationString;
}
