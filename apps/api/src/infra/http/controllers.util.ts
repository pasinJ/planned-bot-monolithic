import { RouteHandlerMethod } from 'fastify';
import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { assoc, isEmpty, pick, tail, toPairs } from 'ramda';

import { ExternalError } from '#shared/error.js';

import { StartHttpServerError } from './server.type.js';

const infraDeps = { any: ioe.left(new ExternalError('EXTERNAL_ERROR', '')) } as const;
type InfraDeps = typeof infraDeps;
type InfraDepsKeys = keyof InfraDeps;

type ExtractRightFromIOEither<Type> = Type extends ioe.IOEither<unknown, infer A> ? A : never;
type ExtractLeftFromIOEither<Type> = Type extends ioe.IOEither<infer E, unknown> ? E : never;
type UnionIOEither<Type extends unknown[]> = Type[number] extends ioe.IOEither<unknown, unknown>
  ? ioe.IOEither<ExtractLeftFromIOEither<Type[number]>, ExtractRightFromIOEither<Type[number]>>
  : never;

export function pipelineBuildController<
  Deps extends Record<DepsKey, Dep>,
  DepsKey extends InfraDepsKeys,
  Dep extends ExtractRightFromIOEither<UnionIOEither<InfraDeps[DepsKey][]>>,
  Handler extends RouteHandlerMethod,
>(
  builder: (args: Deps) => Handler,
  depsList: DepsKey[],
  errorMsg: string,
): ioe.IOEither<StartHttpServerError, Handler> {
  return pipe(
    getInfraDeps<Deps, DepsKey, Dep>(depsList),
    ioe.map(builder),
    ioe.mapLeft((error) => new StartHttpServerError('START_HTTP_SERVER_ERROR', errorMsg).causedBy(error)),
  );
}

function getInfraDeps<Deps extends Record<DepsKey, Dep>, DepsKey extends InfraDepsKeys, Dep>(
  depsList: DepsKey[],
): ioe.IOEither<ExtractLeftFromIOEither<UnionIOEither<InfraDeps[DepsKey][]>>, Deps> {
  type UnionDepsIOEither = UnionIOEither<InfraDeps[DepsKey][]>;
  type UnionDepsIOEitherLeft = ExtractLeftFromIOEither<UnionDepsIOEither>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requiredDeps = toPairs(pick(depsList, infraDeps)) as [string, ioe.IOEither<any, any>][];

  function loop(
    rest: typeof requiredDeps,
    acc: Partial<Deps>,
  ): ioe.IOEither<UnionDepsIOEitherLeft, Partial<Deps>> {
    if (isEmpty(rest)) return ioe.right(acc);
    else {
      const [key, getDep] = rest[0];
      return pipe(
        getDep,
        ioe.map((result) => assoc(key, result, acc)),
        ioe.chain((acc) => loop(tail(rest), acc)),
      );
    }
  }

  return loop(requiredDeps, {}) as ioe.IOEither<UnionDepsIOEitherLeft, Deps>;
}
