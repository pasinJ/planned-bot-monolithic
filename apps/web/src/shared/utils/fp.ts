import { pass } from 'fp-ts-std/IO';
import { execute as executeT } from 'fp-ts-std/Task';
import * as e from 'fp-ts/lib/Either';
import * as io from 'fp-ts/lib/IO';
import * as te from 'fp-ts/lib/TaskEither';
import { AnyFunction } from 'ts-essentials';

export { execute as executeT } from 'fp-ts-std/Task';
export { execute as executeIo } from 'fp-ts-std/IO';

export async function executeTeToPromise<E, A>(input: te.TaskEither<E, A>): Promise<A> {
  const result = await executeT(input);
  if (e.isRight(result)) return Promise.resolve(result.right);
  else {
    if (result.left instanceof Error) throw result.left;
    else return Promise.reject(result.left);
  }
}

export const ioVoid = pass;
export function wrapInIo<F extends AnyFunction>(fn: F): (...args: Parameters<F>) => io.IO<ReturnType<F>> {
  return (...args) =>
    () =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      fn(...args);
}
