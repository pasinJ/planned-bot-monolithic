import { allPass, concat, is, not, pipe as pipeR } from 'ramda';
import { AnyFunction } from 'ts-essentials';
import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<Args extends any[] = any[], ReturnType = any> = new (...args: Args) => ReturnType;

type Literal = z.infer<typeof literalSchema>;
const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export type Json = Literal | { [key: string]: Json } | Json[];
export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]),
);

export function mergeConcatArray(x: unknown, y: unknown) {
  const isArrayNotString = allPass([is(Array), pipeR(is(String), not)]) as (val: unknown) => val is unknown[];
  return isArrayNotString(x) && isArrayNotString(y) ? concat(x, y) : x;
}

export function getPrevItem<T>(list: T[] | readonly T[], currentIndex: number, length = 1): T | undefined {
  const prevIndex = currentIndex - length;

  if (prevIndex < 0) return undefined;
  else return list.at(prevIndex);
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
export function isObject(input: unknown): input is Record<string | number | symbol, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input) && !isFunction(input);
}
export function isFunction(input: unknown): input is AnyFunction {
  return typeof input === 'function';
}
export function isConstructor(input: unknown): input is Constructor {
  return typeof input === 'function' && 'prototype' in input;
}
