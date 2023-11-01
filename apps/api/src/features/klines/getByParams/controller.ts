import { FastifyReply, RouteHandlerMethod } from 'fastify';

import { createGeneralError } from '#shared/errors/generalError.js';

export function buildGetKlinesByParamsController(): RouteHandlerMethod {
  return async function getKlinesByParamsController(_, reply): Promise<FastifyReply> {
    return reply.status(400).send({ error: createGeneralError('A', 'B') });
    // return pipe(
    // te.fromEither(validateRequestBody(body)),
    // te.chainW((parsedBody) => addBtStrategy(deps, parsedBody)),
    // te.match(
    //   (error) =>
    //     match(error)
    //       .returnType<FastifyReply>()
    //       .with(
    //         { name: 'SchemaValidationError' },
    //         { type: 'NotExist' },
    //         { type: 'InvalidCurrency' },
    //         { type: 'CreateBtStrategyModelError' },
    //         (error) => reply.code(400).send({ error }),
    //       )
    //       .with({ type: 'GetByNameAndExchangeFailed' }, { type: 'AddFailed' }, (error) =>
    //         reply.code(500).send({ error }),
    //       )
    //       .exhaustive(),
    //   (result) => reply.code(201).send(result),
    // ),
    // executeT,
    // );
  };
}
