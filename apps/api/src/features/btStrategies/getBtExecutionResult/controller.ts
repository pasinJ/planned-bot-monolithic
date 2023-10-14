import { FastifyReply, RouteHandlerMethod } from 'fastify';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { executeT } from '#shared/utils/fp.js';
import { validateWithZod } from '#shared/utils/zod.js';

import { GetBtExecutionResultDeps, getBtExecutionResult } from './useCase.js';

export type GetBtExecutionResultControllerDeps = GetBtExecutionResultDeps;

export function buildGetBtExecutionResultController(
  deps: GetBtExecutionResultControllerDeps,
): RouteHandlerMethod {
  return function getBtExecutionResultController({ params }, reply): Promise<FastifyReply> {
    return pipe(
      te.fromEither(validateRequestParams(params)),
      te.chainW(({ id }) => getBtExecutionResult(deps, id)),
      te.match(
        (error) =>
          match(error)
            .returnType<FastifyReply>()
            .with({ name: 'SchemaValidationError' }, (error) => reply.code(400).send({ error }))
            .with({ name: 'BtExecutionDaoError', type: 'NotExist' }, (error) =>
              reply.code(404).send({ error }),
            )
            .with(
              { name: 'BtExecutionDaoError', type: 'InvalidStatus' },
              { name: 'BtStrategyDaoError', type: 'NotExist' },
              { name: 'GeneralError', type: 'LastKlineNotExist' },
              { name: 'GeneralError', type: 'ForceExitOpeningTradesFailed' },
              (error) => reply.code(409).send({ error }),
            )
            .with(
              { name: 'BtExecutionDaoError', type: 'GetResultByIdFailed' },
              { name: 'BtStrategyDaoError', type: 'GetByIdFailed' },
              { name: 'KlineDaoError', type: 'GetLastBeforeFailed' },
              (error) => reply.code(500).send({ error }),
            )
            .exhaustive(),
        (result) => reply.code(200).send(result),
      ),
      executeT,
    );
  };
}

function validateRequestParams(params: unknown) {
  return validateWithZod(z.object({ id: z.string().min(1) }), 'Request params is invalid', params);
}
