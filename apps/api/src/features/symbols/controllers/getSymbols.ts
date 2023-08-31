import { FastifyReply, RouteHandlerMethod } from 'fastify';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { is, map, pick } from 'ramda';
import { match } from 'ts-pattern';

import { executeT } from '#shared/utils/fp.js';

import { GetAllSymbolsError, SymbolRepository } from '../symbol.repository.type.js';

type Deps = { symbolRepository: SymbolRepository };
export function buildGetSymbolsController(deps: Deps): RouteHandlerMethod {
  return function getSymbolsController(_, reply): Promise<FastifyReply> {
    const { symbolRepository } = deps;

    return pipe(
      symbolRepository.getAll,
      te.map(map(pick(['name', 'exchange', 'baseAsset', 'quoteAsset']))),
      te.matchW(
        (error) =>
          match(error)
            .when(is(GetAllSymbolsError), () => reply.code(500).send(error.toJSON()))
            .exhaustive(),
        (symbols) => reply.code(200).send(symbols),
      ),
      executeT,
    );
  };
}
