import { onSendHookHandler, preValidationHookHandler } from 'fastify';
import { gte, isNil } from 'ramda';

import { isAppError } from '#shared/errors/appError.js';

import { createHttpServerError } from './server.error.js';
import type { FastifyServer } from './server.js';

export const setNotFoundHandler = (fastify: FastifyServer) => {
  return fastify.setNotFoundHandler((req, reply) => {
    const { method, url, headers, body, log } = req;

    const message = `Route ${method} [${url}] not found`;
    log.info({ request: { headers, body } }, message);

    void reply.code(404).send({ error: { name: 'AppError', type: 'RouteNotFound', message } });
  });
};

export const setErrorHandler = (fastify: FastifyServer): void => {
  fastify.setErrorHandler((error, _, reply) => {
    const { statusCode, log } = reply;
    const isServerError = gte(statusCode, 500);
    const logFn = isServerError ? log.error.bind(log) : log.info.bind(log);

    if (isAppError(error)) {
      logFn({ error }, error.toString());
      return reply.send({ error });
    } else {
      const httpServerError = createHttpServerError('Unhandled', 'Fastify error happened', error);
      logFn({ error: httpServerError }, `Fastify got unhandled error`);

      if (isNil(statusCode) || statusCode === 200) void reply.code(error.statusCode ?? 500);

      return reply.send({ error: httpServerError });
    }
  });
};

export function preValidationHook(
  ...args: Parameters<preValidationHookHandler>
): ReturnType<preValidationHookHandler> {
  const req = args[0];
  const next = args[2];
  const { headers, body, method, routerPath, log } = req;

  log.info({ request: { headers, body } }, `Route ${method} [${routerPath}] receive a request`);

  next();
}

export function onSendHook(
  ...[req, reply, payload, done]: Parameters<onSendHookHandler<unknown>>
): ReturnType<onSendHookHandler<unknown>> {
  const { method, routerPath, log } = req;
  const { statusCode } = reply;

  const isServerError = gte(statusCode, 500);
  const logFn = isServerError ? log.error.bind(log) : log.info.bind(log);
  const logObj = { response: { headers: reply.getHeaders(), body: payload } };
  const logMsg = `Route ${method} [${routerPath}] send response with HTTP${statusCode}`;

  logFn(logObj, logMsg);
  done();
}
