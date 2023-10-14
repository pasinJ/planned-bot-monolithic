import { FastifyReply, RouteHandlerMethod } from 'fastify';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { executeT } from '#shared/utils/fp.js';
import { validateWithZod } from '#shared/utils/zod.js';

export function buildGetBtExecutionResultController(): RouteHandlerMethod {
  return function getBtExecutionResultController({ params }, reply): Promise<FastifyReply> {
    return pipe(
      te.fromEither(validateRequestParams(params)),
      te.match(
        (error) =>
          match(error)
            .returnType<FastifyReply>()
            .with({ name: 'SchemaValidationError' }, (error) => reply.code(400).send({ error }))

            .exhaustive(),
        () => reply.code(200).send('result'),
      ),
      executeT,
    );
  };
}

function validateRequestParams(params: unknown) {
  return validateWithZod(z.object({ id: z.string().min(1) }), 'Request params is invalid', params);
}
