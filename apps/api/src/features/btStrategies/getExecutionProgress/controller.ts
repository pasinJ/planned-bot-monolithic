import { FastifyReply, RouteHandlerMethod } from 'fastify';
import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { DeepReadonly } from 'ts-essentials';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { executeT } from '#shared/utils/fp.js';
import { SchemaValidationError, validateWithZod } from '#shared/utils/zod.js';

import { GetBtExecutionProgressById } from '../DAOs/btExecution.feature.js';

export type GetBtExecutionProgressControllerDeps = DeepReadonly<{
  btExecutionDao: { getProgressById: GetBtExecutionProgressById };
}>;

export function buildGetBtExecutionProgressController(
  deps: GetBtExecutionProgressControllerDeps,
): RouteHandlerMethod {
  return function getBtExecutionProgressController({ params }, reply): Promise<FastifyReply> {
    const { btExecutionDao } = deps;

    return pipe(
      te.fromEither(validateRequestParams(params)),
      te.chainW(({ btExecutionId }) => btExecutionDao.getProgressById(btExecutionId)),
      te.match(
        (error) =>
          match(error)
            .returnType<FastifyReply>()
            .with({ name: 'SchemaValidationError' }, (error) => reply.code(400).send({ error }))
            .with({ type: 'NotExist' }, (error) => reply.code(404).send({ error }))
            .with({ type: 'GetProgressByIdFailed' }, (error) => reply.code(500).send({ error }))
            .exhaustive(),
        (result) => reply.code(200).send(result),
      ),
      executeT,
    );
  };
}

type RequestParams = { btStrategyId: string; btExecutionId: string };
function validateRequestParams(params: unknown): e.Either<SchemaValidationError, RequestParams> {
  return validateWithZod(
    z.object({ btStrategyId: z.string().trim().min(1), btExecutionId: z.string().trim().min(1) }),
    'Request params is invalid',
    params,
  );
}
