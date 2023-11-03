import { FastifyReply, RouteHandlerMethod } from 'fastify';
import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { omit } from 'ramda';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { executeT } from '#shared/utils/fp.js';
import { SchemaValidationError, validateWithZod } from '#shared/utils/zod.js';

import { GetBtStrategyById } from '../DAOs/btStrategy.feature.js';

export type GetBtStrategyControllerDeps = Readonly<{ getBtStrategyById: GetBtStrategyById }>;

export function buildGetBtStrategyController(deps: GetBtStrategyControllerDeps): RouteHandlerMethod {
  return function getBtStrategyController({ params }, reply): Promise<FastifyReply> {
    const { getBtStrategyById } = deps;

    return pipe(
      te.fromEither(validateReqParams(params)),
      te.chainW(({ btStrategyId }) => getBtStrategyById(btStrategyId)),
      te.match(
        (error) =>
          match(error)
            .returnType<FastifyReply>()
            .with({ name: 'SchemaValidationError' }, (error) => reply.code(400).send({ error }))
            .with({ name: 'BtStrategyDaoError', type: 'NotExist' }, (error) =>
              reply.code(404).send({ error }),
            )
            .with({ name: 'BtStrategyDaoError', type: 'GetByIdFailed' }, (error) =>
              reply.code(500).send({ error }),
            )
            .exhaustive(),
        (result) =>
          reply.code(200).send({
            ...omit(['startTimestamp', 'endTimestamp'], result),
            btRange: { start: result.startTimestamp, end: result.endTimestamp },
          }),
      ),
      executeT,
    );
  };
}

type ReqParams = Readonly<{ btStrategyId: string }>;
function validateReqParams(params: unknown): e.Either<SchemaValidationError, ReqParams> {
  return validateWithZod(
    z.object({ btStrategyId: z.string().trim().min(1) }),
    'Request params is invalid',
    params,
  );
}
