import { RouteHandlerMethod } from 'fastify';
import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { assoc, isEmpty, pick, tail, toPairs } from 'ramda';

import { HttpServerError } from './server.type.js';

const infraDeps = { any: ioe.left('any') } as const;
type InfraDeps = typeof infraDeps;
type InfraDepsKeys = keyof InfraDeps;

type ExtractRightFromIOEither<Type> = Type extends ioe.IOEither<infer E, infer A> ? A : never;
type ExtractLeftFromIOEither<Type> = Type extends ioe.IOEither<infer E, infer A> ? E : never;
type UnionIOEither<Type extends Array<any>> = Type[number] extends ioe.IOEither<infer E, infer A>
  ? ioe.IOEither<ExtractLeftFromIOEither<Type[number]>, ExtractRightFromIOEither<Type[number]>>
  : never;

export function pipelineBuildController<
  Deps extends Record<DepsKey, Dep>,
  DepsKey extends InfraDepsKeys,
  Dep extends ExtractRightFromIOEither<UnionIOEither<Array<InfraDeps[DepsKey]>>>,
  Handler extends RouteHandlerMethod,
>(
  builder: (args: Deps) => Handler,
  depsList: DepsKey[],
  errorMsg: string,
): ioe.IOEither<HttpServerError, Handler> {
  return pipe(
    getInfraDeps<Deps, DepsKey, Dep>(depsList),
    ioe.map(builder),
    ioe.mapLeft((error) => new HttpServerError('INTERNAL_SERVER_ERROR', errorMsg, error)),
  );
}

function getInfraDeps<Deps extends Record<DepsKey, Dep>, DepsKey extends InfraDepsKeys, Dep extends any>(
  depsList: DepsKey[],
): ioe.IOEither<ExtractLeftFromIOEither<UnionIOEither<Array<InfraDeps[DepsKey]>>>, Deps> {
  type UnionDepsIOEither = UnionIOEither<Array<InfraDeps[DepsKey]>>;
  type UnionDepsIOEitherLeft = ExtractLeftFromIOEither<UnionDepsIOEither>;

  const requiredDeps = toPairs(pick(depsList, infraDeps)) as [string, any][];

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
