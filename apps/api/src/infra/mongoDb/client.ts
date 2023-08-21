import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import mongoose, { Mongoose } from 'mongoose';

import { LoggerIO } from '#infra/logging.js';
import { getMongoDbConfig } from '#shared/config/mongoDb.js';
import { ErrorBase, ExternalError, createErrorFromUnknown } from '#shared/error.js';

export class CreateMongoDbClientError extends ErrorBase<'CREATE_CLIENT_ERROR', ExternalError> {}
export class DisconnectMongoDbClientError extends ErrorBase<'DISCONNECT_CLIENT_ERROR', ExternalError> {}

export function createMongoDbClient(loggerIO: LoggerIO): te.TaskEither<CreateMongoDbClientError, Mongoose> {
  const { URI } = getMongoDbConfig();
  return pipe(
    te.fromIO(loggerIO.info('MongoDB client start connecting to MongoDB')),
    te.chain(() =>
      te.tryCatch(
        () => mongoose.connect(URI),
        createErrorFromUnknown(CreateMongoDbClientError, 'CREATE_CLIENT_ERROR'),
      ),
    ),
    te.chainFirstIOK(() => loggerIO.info('MongoDB client connected')),
  );
}

export function disconnectMongoDbClient(
  client: Mongoose,
  loggerIo: LoggerIO,
): te.TaskEither<DisconnectMongoDbClientError, void> {
  return pipe(
    te.fromIO(loggerIo.info('MongoDB client start disconnecting from MongoDB')),
    te.chain(() =>
      te.tryCatch(
        () => client.disconnect(),
        createErrorFromUnknown(DisconnectMongoDbClientError, 'DISCONNECT_CLIENT_ERROR'),
      ),
    ),
    te.chainIOK(() => loggerIo.info('MongoDB client successfully disconnected')),
    te.orElseFirstIOK((error) =>
      loggerIo.error({ error }, 'MongoDB client failed to disconnect a connection from MongoDB'),
    ),
  );
}
