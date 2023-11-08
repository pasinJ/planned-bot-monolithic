import { Reference } from 'isolated-vm';
import { toPairs } from 'ramda';
import { AnyFunction, Primitive } from 'ts-essentials';

import { isFunction, isObject } from '#shared/utils/general.js';

import { ivm } from './isolatedVm.js';

type ContextValue =
  | Primitive
  | AnyFunction
  | { [key: string | number | symbol]: ContextValue }
  | ContextValue[];
type AnyContext = Record<string | number | symbol, ContextValue>;

export async function importObjIntoVm<Name extends string | number | symbol>(
  name: Name,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<string | number | symbol, any>,
  ref: Reference<AnyContext>,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
): Promise<void[]> {
  await ref.set(name, new ivm.ExternalCopy({}).copyInto());
  const objRef = (await ref.get(name)) as Reference<Record<string | number | symbol, ContextValue>>;

  return Promise.all(
    toPairs(obj).flatMap(([key, value]) => {
      if (isObject(value)) {
        return importObjIntoVm(key, value, objRef).then(() => undefined);
      } else if (isFunction(value)) {
        return objRef.set(key, (...args: unknown[]) => value(...args) as unknown);
      } else if (!isFunction(value)) {
        return objRef.set(key, value as Primitive, { copy: true });
      } else {
        return Promise.resolve(undefined);
      }
    }),
  );
}
