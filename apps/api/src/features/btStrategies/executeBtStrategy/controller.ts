import { FastifyReply, RouteHandlerMethod } from 'fastify';
import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { executeT } from '#shared/utils/fp.js';
import { SchemaValidationError, validateWithZod } from '#shared/utils/zod.js';

import { ExecuteBtStrategyDeps, executeBtStrategy } from './useCase.js';

export type ExecuteBtStrategyControllerDeps = ExecuteBtStrategyDeps;

export function buildExecuteBtStrategyController(deps: ExecuteBtStrategyControllerDeps): RouteHandlerMethod {
  return ({ params }, reply): Promise<FastifyReply> => {
    return pipe(
      te.fromEither(validateRequestParams(params)),
      te.chainW(({ btStrategyId }) => executeBtStrategy(deps, { btStrategyId })),
      te.match(
        (error) =>
          match(error)
            .returnType<FastifyReply>()
            .with({ name: 'SchemaValidationError' }, (error) => reply.code(400).send({ error }))
            .with({ type: 'StrategyNotExist' }, (error) => reply.code(404).send({ error }))
            .with({ type: 'ExceedJobMaxSchedulingLimit' }, (error) => reply.code(409).send({ error }))
            .with({ type: 'ExistByIdFailed' }, { type: 'ScheduleJobFailed' }, (error) =>
              reply.code(500).send({ error }),
            )
            .exhaustive(),
        (result) => reply.code(202).send(result),
      ),
      executeT,
    );
  };
}

type RequestParams = { btStrategyId: string };
function validateRequestParams(params: unknown): e.Either<SchemaValidationError, RequestParams> {
  return validateWithZod(
    z.object({ btStrategyId: z.string().nonempty() }),
    'Request params is invalid',
    params,
  );
}
