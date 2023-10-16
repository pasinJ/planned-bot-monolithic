import { Primitive, UnionToIntersection } from "ts-essentials";
import { z } from "zod";

/* eslint-disable @typescript-eslint/no-explicit-any */
type IterateOnTuple<T extends [...any[]]> = T extends [
  infer Head,
  ...infer Tail
]
  ? [Unbrand<Head>, ...IterateOnTuple<Tail>]
  : [];

type RemoveBrand<T> = T extends z.BRAND<infer Brand>
  ? T extends (
      | z.BRAND<Brand>
      | UnionToIntersection<{ [K in Brand]: z.BRAND<K> }[Brand]>
    ) &
      infer X
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
