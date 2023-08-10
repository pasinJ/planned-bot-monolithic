import { gte, isNil } from 'ramda';

import { getErrorSummary } from '#shared/error.js';

import { HttpServerError } from './server.error.js';
import type { FastifyServer } from './server.js';

export const setNotFoundHandler = (fastify: FastifyServer) => {
  return fastify.setNotFoundHandler((req, reply) => {
    const { method, url, headers, body, log } = req;

    const message = `Route ${method} [${url}] not found`;
    log.info({ request: { headers, body } }, message);

    void reply.code(404).send({ error: { name: 'Route not found', message } });
  });
};

export const addPreValidation = (fastify: FastifyServer): void => {
  fastify.addHook('preValidation', (req, _, next) => {
    const { headers, body, method, routerPath, log } = req;

    log.info({ request: { headers, body } }, `Route ${method} [${routerPath}] receive a request`);

    next();
  });
};

export const setErrorHandler = (fastify: FastifyServer): void => {
  fastify.setErrorHandler((fastifyError, _, reply) => {
    const { statusCode, log } = reply;

    if (isNil(statusCode) || statusCode === 200) void reply.code(fastifyError.statusCode ?? 500);

    const error = new HttpServerError('INTERNAL_SERVER_ERROR', getErrorSummary(fastifyError), fastifyError);
    const isServerError = gte(statusCode, 500);
    const logFn = isServerError ? log.error.bind(log) : log.info.bind(log);
    const logMsg = `Fastify handles error: ${getErrorSummary(error)}`;

    logFn({ error }, logMsg);

    return reply.send({ error });
  });
};

export const addOnSend = (fastify: FastifyServer): void => {
  fastify.addHook('onSend', (req, reply, payload, done) => {
    const { method, routerPath, log } = req;
    const { statusCode } = reply;

    const isServerError = gte(statusCode, 500);
    const logFn = isServerError ? log.error.bind(log) : log.info.bind(log);
    const logObj = { response: { headers: reply.getHeaders(), body: payload } };
    const logMsg = `Route ${method} [${routerPath}] send response with HTTP${statusCode}`;

    logFn(logObj, logMsg);
    done();
  });
};
