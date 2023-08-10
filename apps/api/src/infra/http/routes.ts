import { addOnSend, addPreValidation } from './hooks.js';
import type { FastifyServer } from './server.js';

export function addGeneralRoutes(fastify: FastifyServer) {
  fastify.head('/', (_, reply) => reply.code(200).send());
}

export function addRoutesV1(fastify: FastifyServer) {
  return fastify.register(
    (instance: FastifyServer, _, done) => {
      addPreValidation(instance);
      addOnSend(instance);

      instance.get('/', () => 'Hello');

      done();
    },
    { prefix: '/v1' },
  );
}
