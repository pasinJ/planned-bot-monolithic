import { allPass, concat, is, not, pipe as pipeR } from 'ramda';
import { z } from 'zod';

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

export function getPrevItem<T>(list: T[], currentIndex: number, length = 1): T | undefined {
  const prevIndex = currentIndex - length;

  if (prevIndex < 0) return undefined;
  else return list.at(prevIndex);
}

export function isError(input: unknown): input is Error {
  return is(Error, input);
}
export function isUndefined(input: unknown): input is undefined {
  return z.undefined().safeParse(input).success;
}
