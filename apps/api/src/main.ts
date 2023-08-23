import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Mongoose } from 'mongoose';

import { createSymbolRepository } from '#features/symbols/symbol.repository.js';
import { SymbolRepository } from '#features/symbols/symbol.repository.type.js';
import { buildHttpServer, startHttpServer } from '#infra/http/server.js';
import { createLoggerIo, createMainLogger } from '#infra/logging.js';
import { createMongoDbClient } from '#infra/mongoDb/client.js';
import { addGracefulShutdown } from '#infra/process/shutdown.js';
import { startupProcess } from '#infra/process/startup.js';
import { createBnbService } from '#infra/services/binanceService.js';
import { BnbService } from '#infra/services/binanceService.type.js';
import { dateService } from '#infra/services/dateService.js';
import { idService } from '#infra/services/idService.js';
import { getErrorSummary } from '#shared/error.js';
import { executeT } from '#utils/fp.js';

const mainLogger = createMainLogger();
const logger = createLoggerIo('Process', mainLogger);

await executeT(
  pipe(
    te.Do,
    te.bindW('mongoDbClient', () => createMongoDbClient(logger)),
    te.bindW('bnbService', () => createBnbServiceWithDeps()),
    te.bindW('symbolRepository', (deps) => createSymbolRepositoryWithDeps(deps)),
    te.bindW('server', () => te.fromEither(buildHttpServer(mainLogger))),
    te.chainFirstW((deps) => startupProcessWithDeps(deps)),
    te.chainFirstW(({ server }) => startHttpServer(server)),
    te.chainFirstIOK((deps) => addGracefulShutdown(deps, logger)),
    te.orElseFirstIOK((error) =>
      logger.errorIo({ error }, 'Starting process failed: %s', getErrorSummary(error)),
    ),
    te.orElseFirstIOK(() => process.exit(1)),
  ),
);

function createBnbServiceWithDeps() {
  return createBnbService({ dateService, idService, mainLogger });
}
function createSymbolRepositoryWithDeps({ mongoDbClient }: { mongoDbClient: Mongoose }) {
  return te.fromIOEither(createSymbolRepository(mongoDbClient));
}
function startupProcessWithDeps(deps: { bnbService: BnbService; symbolRepository: SymbolRepository }) {
  return startupProcess({ ...deps, logger: logger });
}
