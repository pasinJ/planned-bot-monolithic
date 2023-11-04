import { isValid } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { z } from 'zod';

import { schemaForType } from './zod';

export type DecimalString = string & z.BRAND<'DecimalString'>;
export const decimalStringSchema = schemaForType<DecimalString>().with(z.string().brand('DecimalString'));
export function numberToDecimalString(num: number): DecimalString {
  return num.toString() as DecimalString;
}

export type IntegerString = string & z.BRAND<'IntegerString'>;
export function numberToIntegerString(num: number): IntegerString {
  return num.toString() as IntegerString;
}

export type HexColor = string & z.BRAND<'HexColor'>;

export type TimezoneString = string & z.BRAND<'TimezoneString'>;
export const timezoneStringSchema = z
  .string()
  .refine(isValidTimezoneString, 'String is an invalid timezone')
  .brand('TimezoneString');
export function isValidTimezoneString(input: string): input is TimezoneString {
  return isValid(utcToZonedTime(new Date(), input));
}

export type DurationString = string & z.BRAND<'DurationString'>;
export const durationStringSchema = schemaForType<DurationString>().with(z.string().brand('DurationString'));
