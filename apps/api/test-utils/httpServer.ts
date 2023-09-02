import { HTTPMethods, RouteHandlerMethod } from 'fastify';

import { buildHttpServer } from '#infra/http/server.js';
import { createMainLogger } from '#infra/logging.js';
import { unsafeUnwrapEitherRight } from '#shared/utils/fp.js';

export function setupTestServer<Deps>(
  method: HTTPMethods,
  url: string,
  buildHandler: (deps: Deps) => RouteHandlerMethod,
  mockDeps: (overrides?: Partial<Deps>) => Deps,
) {
  return (deps?: Partial<Deps>) => {
    const httpServer = unsafeUnwrapEitherRight(buildHttpServer(createMainLogger()));
    const handler = buildHandler(mockDeps(deps));

    httpServer.route({ method, url, handler });

    return httpServer;
  };
}
