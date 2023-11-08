import { Decimal } from 'decimal.js';
import { Primitive, UnionToIntersection } from 'ts-essentials';
import { z } from 'zod';

export const nonEmptyString = z.string().trim().min(1);

export const nonNegativeFloat8Digits = z
  .number()
  .nonnegative()
  .transform((val) => new Decimal(val).toDecimalPlaces(8, Decimal.ROUND_UP).toNumber());
export const nonNegativePercentage8Digits = z
  .number()
  .nonnegative()
  .max(100)
  .transform((val) => new Decimal(val).toDecimalPlaces(8, Decimal.ROUND_UP).toNumber());

export type StringDatetimeToDateSchema = z.ZodBranded<z.ZodPipeline<z.ZodString, z.ZodDate>, 'ValidDate'>;
export const stringDatetimeToDate = z.string().datetime().pipe(z.coerce.date()).brand('ValidDate');

export type KeysOfUnion<T> = T extends T ? keyof T : never;

/* eslint-disable @typescript-eslint/no-explicit-any */
type IterateOnTuple<T extends [...any[]]> = T extends [infer Head, ...infer Tail]
  ? [Unbrand<Head>, ...IterateOnTuple<Tail>]
  : [];

type RemoveBrand<T> = T extends z.BRAND<infer Brand>
  ? T extends (z.BRAND<Brand> | UnionToIntersection<{ [K in Brand]: z.BRAND<K> }[Brand]>) & infer X
    ? RemoveBrand<X>
    : never
  : T;

export type Unbrand<T> = T extends Primitive
  ? RemoveBrand<T>
  : T extends Promise<infer E>
  ? Promise<Unbrand<E>>
  : T extends [any, ...any[]]
  ? IterateOnTuple<RemoveBrand<T>>
  : T extends (infer E)[]
  ? Unbrand<E>[]
  : T extends Set<infer E>
  ? Set<Unbrand<E>>
  : T extends Date
  ? RemoveBrand<T>
  : T extends Map<infer E, infer F>
  ? Map<Unbrand<E>, Unbrand<F>>
  : {
      [k in Exclude<keyof T, keyof z.BRAND<any>>]: Unbrand<T[k]>;
    };
/* eslint-enable @typescript-eslint/no-explicit-any */
