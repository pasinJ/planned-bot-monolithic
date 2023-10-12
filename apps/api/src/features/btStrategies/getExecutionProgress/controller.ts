import { RouteHandlerMethod } from 'fastify';

import { createGeneralError } from '#shared/errors/generalError.js';

export function buildGetBtExecutionProgressController(): RouteHandlerMethod {
  return function getBtExecutionProgressController(_, reply) {
    return reply.code(404).send({ error: createGeneralError('x', 'y') });
  };
}
