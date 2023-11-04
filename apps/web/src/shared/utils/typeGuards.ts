import { is } from 'ramda';
import { AnyFunction } from 'ts-essentials';
import { z } from 'zod';

export function isString(input: unknown): input is string {
  return z.string().safeParse(input).success;
}
export function isError(input: unknown): input is Error {
  return (
    is(Error, input) ||
    z
      .object({
        name: z.string(),
        message: z.string(),
        cause: z.any().optional(),
        stack: z.string().optional(),
      })
      .safeParse(input).success
  );
}
export function isUndefined(input: unknown): input is undefined {
  return z.undefined().safeParse(input).success;
}
export function isFunction<T extends AnyFunction = AnyFunction>(input: unknown): input is T {
  return typeof input === 'function';
}
