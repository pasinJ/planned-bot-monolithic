import { FastifyReply, RouteHandlerMethod } from 'fastify';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { map, pick } from 'ramda';
import { match } from 'ts-pattern';

import { executeT } from '#shared/utils/fp.js';

import { SymbolRepo } from '../repositories/symbol.type.js';

export type GetSymbolsControllerDeps = { symbolRepo: SymbolRepo };

export function buildGetSymbolsController(deps: GetSymbolsControllerDeps): RouteHandlerMethod {
  return function getSymbolsController(_, reply): Promise<FastifyReply> {
    const { symbolRepo } = deps;

    return pipe(
      symbolRepo.getAll,
      te.map(map(pick(['name', 'exchange', 'baseAsset', 'quoteAsset']))),
      te.matchW(
        (error) =>
          match(error)
            .returnType<FastifyReply>()
            .with({ type: 'GetAllSymbolsError' }, (error) => reply.code(500).send(error))
            .exhaustive(),
        (symbols) => reply.code(200).send(symbols),
      ),
      executeT,
    );
  };
}
