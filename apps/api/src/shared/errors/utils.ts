import { anyPass } from 'ramda';
import { z } from 'zod';

type NeverKeys<T> = keyof { [K in keyof T as T[K] extends never ? K : never]: T[K] };
type OptionalKeys<T> = keyof { [K in keyof T as undefined extends T[K] ? K : never]: T[K] };
type RequiredKeys<T> = Exclude<keyof T, NeverKeys<T> | OptionalKeys<T>>;

type ZodShape<O extends Record<string, unknown>> = {
  [K in NeverKeys<O>]: z.ZodOptional<z.ZodNever>;
} & {
  [K in OptionalKeys<O>]: z.ZodOptional<z.ZodTypeAny>;
} & {
  [K in RequiredKeys<O>]: O[K] extends (...args: unknown[]) => unknown
    ? z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>
    : z.ZodTypeAny;
};

export function implementZodSchema<Model extends Record<string, unknown>>() {
  return {
    with: <T extends ZodShape<Model> & { [unknownKey in Exclude<keyof T, keyof Model>]: never }>(
      schema: z.ZodObject<T>,
    ) => {
      return schema;
    },
  };
}

export function defineCauseSchema(predicateList: ((input: unknown) => boolean)[]) {
  return z.any().refine(anyPass(predicateList), { message: 'cause property is invalid' });
}
