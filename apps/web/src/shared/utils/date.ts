import { utcToZonedTime as _utcToZonedTime } from 'date-fns-tz';
import { z } from 'zod';

import { TimezoneString } from './string';
import { schemaForType } from './zod';

export type ValidDate = Date & z.BRAND<'ValidDate'>;
export const validDateSchema = schemaForType<ValidDate>().with(z.date().brand('ValidDate'));

export type LocalDate = ValidDate & z.BRAND<'LocalDate'>;
export const localDateSchema = schemaForType<ValidDate>().with(validDateSchema.brand('LocalDate'));

export function utcToZonedTime(date: ValidDate, timezone: TimezoneString): LocalDate {
  return _utcToZonedTime(date, timezone) as LocalDate;
}
