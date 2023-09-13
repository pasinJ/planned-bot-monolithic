import { FastifyReply, RouteHandlerMethod } from 'fastify';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { map, pick } from 'ramda';
import { match } from 'ts-pattern';

import { executeT } from '#shared/utils/fp.js';

import { SymbolModelDao } from '../data-models/symbol.dao.type.js';

export type GetSymbolsControllerDeps = { symbolModelDao: Pick<SymbolModelDao, 'getAll'> };

export function buildGetSymbolsController(deps: GetSymbolsControllerDeps): RouteHandlerMethod {
  return function getSymbolsController(_, reply): Promise<FastifyReply> {
    const { symbolModelDao } = deps;

    return pipe(
      symbolModelDao.getAll,
      te.map(map(pick(['name', 'exchange', 'baseAsset', 'quoteAsset']))),
      te.matchW(
        (error) =>
          match(error)
            .returnType<FastifyReply>()
            .with({ type: 'GetAllFailed' }, (error) => reply.code(500).send(error))
            .exhaustive(),
        (symbols) => reply.code(200).send(symbols),
      ),
      executeT,
    );
  };
}
