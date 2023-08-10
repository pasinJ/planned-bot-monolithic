import tUtil from 'fp-ts-std/Task';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { startHttpServer } from '#infra/http/server.js';
import { createPinoLogger, wrapLogger } from '#infra/logging.js';
import { addGracefulShutdown } from '#infra/process/shutdown.js';

const logger = createPinoLogger('Process');
const loggerIO = wrapLogger(logger);

await tUtil.execute(
  pipe(
    te.Do,
    te.bindW('server', () => startHttpServer()),
    te.chainIOK(({ server }) => addGracefulShutdown(server, logger)),
    te.orElseFirstIOK((error) => loggerIO.error({ error }, 'Starting process failed')),
  ),
);
