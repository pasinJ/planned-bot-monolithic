import { isValid } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { z } from 'zod';

export type DecimalString = string & z.BRAND<'DecimalString'>;
export type IntegerString = string & z.BRAND<'IntegerString'>;
export type HexColor = string & z.BRAND<'HexColor'>;

export type TimezoneString = string & z.BRAND<'TimezoneString'>;
export const timezoneStringSchema = z
  .string()
  .refine(isValidTimezoneString, 'String is an invalid timezone')
  .brand('TimezoneString');
export function isValidTimezoneString(input: string): input is TimezoneString {
  return isValid(utcToZonedTime(new Date(), input));
}
