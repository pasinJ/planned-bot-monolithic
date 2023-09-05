import { is } from 'ramda';
import { z } from 'zod';

export function isString(input: unknown): input is string {
  return z.string().safeParse(input).success;
}
export function isError(input: unknown): input is Error {
  return is(Error, input);
}
export function isUndefined(input: unknown): input is undefined {
  return z.undefined().safeParse(input).success;
}
