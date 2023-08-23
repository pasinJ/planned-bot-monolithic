import { RouteOptions } from 'fastify';

import { FastifyServer } from '#infra/http/server.type.js';

export function addRoute(fastify: FastifyServer, options: RouteOptions) {
  fastify.route(options);
}
