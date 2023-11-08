import { HTTPMethods, RouteHandlerMethod } from 'fastify';
import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { DeepPartial } from 'ts-essentials';

import { PortNumber } from '#infra/http/server.config.js';
import { FastifyServer, buildHttpServer } from '#infra/http/server.js';
import { AppDeps } from '#shared/appDeps.type.js';
import { executeIo, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';

import { mockMainLogger } from './services.js';

export function setupTestServer<Deps>(
  method: HTTPMethods,
  url: string,
  buildHandler: (deps: Deps) => RouteHandlerMethod,
  mockDeps: (overrides?: DeepPartial<Deps>) => Deps,
) {
  return (deps?: DeepPartial<Deps>) => {
    const httpServer = unsafeUnwrapEitherRight(
      buildHttpServer(mockMainLogger(), () => ({ PORT_NUMBER: 8080 as PortNumber }), {} as AppDeps),
    );
    const handler = buildHandler(mockDeps(deps));

    let fastifyServer: FastifyServer;
    executeIo(
      httpServer.config((fastify) => {
        fastifyServer = fastify;
        return pipe(ioe.right(fastify.route({ method, url, handler })), ioe.asUnit);
      }),
    );

    // @ts-expect-error this is okay
    return fastifyServer;
  };
}
