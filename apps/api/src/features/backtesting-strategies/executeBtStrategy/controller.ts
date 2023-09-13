import { FastifyReply, RouteHandlerMethod } from 'fastify';
import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { JobScheduler } from '#infra/services/jobScheduler/service.type.js';
import { executeT } from '#shared/utils/fp.js';
import { SchemaValidationError, parseWithZod } from '#shared/utils/zod.js';

import { BtStrategyModelDao } from '../data-models/btStrategy.dao.type.js';
import { executeBtStrategy } from './useCase.js';

export type ExecuteBtStrategyControllerDeps = {
  btStrategyModelDao: Pick<BtStrategyModelDao, 'existById'>;
  jobScheduler: Pick<JobScheduler, 'addBtJob'>;
};

export function buildExecuteBtStrategyController(deps: ExecuteBtStrategyControllerDeps): RouteHandlerMethod {
  return ({ params }, reply): Promise<FastifyReply> => {
    return pipe(
      te.fromEither(validateParams(params)),
      te.chainW(({ id }) => executeBtStrategy(deps, { btStrategyId: id })),
      te.match(
        (error) =>
          match(error)
            .returnType<FastifyReply>()
            .with({ name: 'SchemaValidationError' }, (error) => reply.code(400).send(error))
            .with({ type: 'StrategyNotExist' }, (error) => reply.code(404).send(error))
            .with({ name: 'BusinessError' }, { type: 'ExceedJobMaxLimit' }, (error) =>
              reply.code(409).send(error),
            )
            .with({ type: 'ExistByIdFailed' }, { type: 'AddBtJobFailed' }, (error) =>
              reply.code(500).send(error),
            )
            .exhaustive(),
        (result) => reply.code(202).send(result),
      ),
      executeT,
    );
  };
}

function validateParams(params: unknown): e.Either<SchemaValidationError, { id: string }> {
  return parseWithZod(z.object({ id: z.string().nonempty() }), 'Request params is invalid', params);
}
