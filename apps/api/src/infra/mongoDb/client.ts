import { PrismaClient } from '@prisma/client';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { LoggerIO } from '#infra/logging.js';
import { ErrorBase, createErrorFromUnknown } from '#shared/error.js';

export class MongoDbError extends ErrorBase<'CREATE_CONNECTION_ERROR' | 'DISCONNECT_ERROR'> {}

export function createMongoDbClient(loggerIO: LoggerIO): te.TaskEither<MongoDbError, PrismaClient> {
  return pipe(
    te.of(new PrismaClient()),
    te.chainFirstIOK(() => loggerIO.info('MongoDB client start connecting to MongoDB')),
    te.chainFirst((client) =>
      te.tryCatch(
        () => client.$runCommandRaw({ ping: 1 }),
        createErrorFromUnknown(
          MongoDbError,
          'CREATE_CONNECTION_ERROR',
          'MongoDB client failed to create a connection to MongoDB',
        ),
      ),
    ),
    te.chainFirstIOK(() => loggerIO.info('MongoDB client connected')),
  );
}

export function disconnectMongoDbClient(
  client: PrismaClient,
  loggerIo: LoggerIO,
): te.TaskEither<MongoDbError, void> {
  return pipe(
    te.fromIO(loggerIo.info('MongoDB client start disconnecting from MongoDB')),
    te.chain(() =>
      te.tryCatch(() => client.$disconnect(), createErrorFromUnknown(MongoDbError, 'DISCONNECT_ERROR')),
    ),
    te.chainIOK(() => loggerIo.info('MongoDB client successfully disconnected')),
    te.orElseFirstIOK((error) =>
      loggerIo.error({ error }, 'MongoDB client failed to disconnect a connection from MongoDB'),
    ),
  );
}
