import { execute as executeT } from 'fp-ts-std/Task';
import * as e from 'fp-ts/lib/Either';
import * as te from 'fp-ts/lib/TaskEither';

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
