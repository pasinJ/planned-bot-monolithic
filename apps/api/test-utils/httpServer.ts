import { HTTPMethods, RouteHandlerMethod } from 'fastify';

import { buildHttpServer } from '#infra/http/server.js';
import { createMainLogger } from '#infra/logging.js';
import { DeepPartial } from '#shared/common.type.js';
import { unsafeUnwrapEitherRight } from '#shared/utils/fp.js';

export function setupTestServer<Deps>(
  method: HTTPMethods,
  url: string,
  buildHandler: (deps: Deps) => RouteHandlerMethod,
  mockDeps: (overrides?: DeepPartial<Deps>) => Deps,
) {
  return (deps?: DeepPartial<Deps>) => {
    const httpServer = unsafeUnwrapEitherRight(buildHttpServer(createMainLogger()));
    const handler = buildHandler(mockDeps(deps));

    httpServer.route({ method, url, handler });

    return httpServer;
  };
}
