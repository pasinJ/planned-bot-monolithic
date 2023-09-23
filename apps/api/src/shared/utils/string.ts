import { isValid } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { z } from 'zod';

export const nonEmptyStringSchema = z.string().trim().nonempty();

export type IsoUtcDateString = z.infer<typeof isoUtcDateStringSchema>;
export const isoUtcDateStringSchema = z
  .string()
  .datetime({
    precision: 3,
    offset: false,
    message: 'String must be ISO format without timezone offset and has millisecond precision less than 3',
  })
  .brand('IsoUtcDateString');

export type TimezoneString = string & z.BRAND<'TimezoneString'>;
export const timezoneStringSchema = z
  .string()
  .refine(isValidTimezoneString, 'String is an invalid timezone')
  .brand('TimezoneString');

export function isString(input: unknown): input is string {
  return z.string().safeParse(input).success;
}

export function isValidTimezoneString(input: string): input is TimezoneString {
  return isValid(utcToZonedTime(new Date(), input));
}
