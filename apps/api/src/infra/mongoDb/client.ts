import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import mongoose, { Mongoose } from 'mongoose';

import { LoggerIO } from '#infra/logging.js';
import { getMongoDbConfig } from '#shared/config/mongoDb.js';
import { ErrorBase, createErrorFromUnknown } from '#shared/error.js';

export class MongoDbError extends ErrorBase<'CREATE_CONNECTION_ERROR' | 'DISCONNECT_ERROR'> {}

export function createMongoDbClient(loggerIO: LoggerIO): te.TaskEither<MongoDbError, Mongoose> {
  const { URI } = getMongoDbConfig();
  return pipe(
    te.fromIO(loggerIO.info('MongoDB client start connecting to MongoDB')),
    te.chain(() =>
      te.tryCatch(
        () => mongoose.connect(URI),
        createErrorFromUnknown(MongoDbError, 'CREATE_CONNECTION_ERROR'),
      ),
    ),
    te.chainFirstIOK(() => loggerIO.info('MongoDB client connected')),
  );
}

export function disconnectMongoDbClient(
  client: Mongoose,
  loggerIo: LoggerIO,
): te.TaskEither<MongoDbError, void> {
  return pipe(
    te.fromIO(loggerIo.info('MongoDB client start disconnecting from MongoDB')),
    te.chain(() =>
      te.tryCatch(() => client.disconnect(), createErrorFromUnknown(MongoDbError, 'DISCONNECT_ERROR')),
    ),
    te.chainIOK(() => loggerIo.info('MongoDB client successfully disconnected')),
    te.orElseFirstIOK((error) =>
      loggerIo.error({ error }, 'MongoDB client failed to disconnect a connection from MongoDB'),
    ),
  );
}
