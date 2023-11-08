import { FastifyReply, RouteHandlerMethod } from 'fastify';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { omit } from 'ramda';
import { match } from 'ts-pattern';

import { executeT } from '#shared/utils/fp.js';

import { GetBtStrategies } from '../DAOs/btStrategy.feature.js';

export type GetBtStrategiesControllerDeps = Readonly<{ getBtStrategies: GetBtStrategies }>;

export function buildGetBtStrategiesController(deps: GetBtStrategiesControllerDeps): RouteHandlerMethod {
  return function getBtStrategiesController(_, reply): Promise<FastifyReply> {
    const { getBtStrategies } = deps;

    return pipe(
      getBtStrategies,
      te.match(
        (error) =>
          match(error)
            .returnType<FastifyReply>()
            .with({ name: 'BtStrategyDaoError', type: 'GetBtStrategiesFailed' }, (error) =>
              reply.code(500).send({ error }),
            )
            .exhaustive(),
        (result) =>
          reply.code(200).send(
            result.map((btStrategy) => ({
              ...omit(['startTimestamp', 'endTimestamp'], btStrategy),
              btRange: { start: btStrategy.startTimestamp, end: btStrategy.endTimestamp },
            })),
          ),
      ),
      executeT,
    );
  };
}
