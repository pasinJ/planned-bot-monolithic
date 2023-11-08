import { FastifyReply, RouteHandlerMethod } from 'fastify';
import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { executeT } from '#shared/utils/fp.js';
import { SchemaValidationError, validateWithZod } from '#shared/utils/zod.js';

import { GetLastBtExecutionProgress } from '../DAOs/btExecution.feature.js';

export type GetLastBtExecutionProgressControllerDeps = Readonly<{
  getLastBtExecutionProgress: GetLastBtExecutionProgress;
}>;

export function buildGetLastBtExecutionProgressController(
  deps: GetLastBtExecutionProgressControllerDeps,
): RouteHandlerMethod {
  return function getLastBtExecutionProgressController({ params }, reply): Promise<FastifyReply> {
    const { getLastBtExecutionProgress } = deps;

    return pipe(
      te.fromEither(validateReqParams(params)),
      te.chainW(({ btStrategyId }) => getLastBtExecutionProgress(btStrategyId)),
      te.match(
        (error) =>
          match(error)
            .returnType<FastifyReply>()
            .with({ name: 'SchemaValidationError' }, (error) => reply.code(400).send({ error }))
            .with({ name: 'BtExecutionDaoError', type: 'GetLastBtExecutionProgressFailed' }, (error) =>
              reply.code(500).send({ error }),
            )
            .exhaustive(),
        (result) => reply.code(200).send(result),
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
