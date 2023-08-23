import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import mongoose, { Mongoose } from 'mongoose';

import { LoggerIo } from '#infra/logging.js';
import { getMongoDbConfig } from '#shared/config/mongoDb.js';
import { ErrorBase, ExternalError, createErrorFromUnknown } from '#shared/error.js';

export class CreateMongoDbClientError extends ErrorBase<'CREATE_CLIENT_ERROR', ExternalError> {}
export class DisconnectMongoDbClientError extends ErrorBase<'DISCONNECT_CLIENT_ERROR', ExternalError> {}

export function createMongoDbClient(logger: LoggerIo): te.TaskEither<CreateMongoDbClientError, Mongoose> {
  const { URI } = getMongoDbConfig();
  return pipe(
    te.fromIO(logger.infoIo('MongoDB client start connecting to MongoDB')),
    te.chain(() =>
      te.tryCatch(
        () => mongoose.connect(URI),
        createErrorFromUnknown(CreateMongoDbClientError, 'CREATE_CLIENT_ERROR'),
      ),
    ),
    te.chainFirstIOK(() => logger.infoIo('MongoDB client connected')),
  );
}

export function disconnectMongoDbClient(
  client: Mongoose,
  logger: LoggerIo,
): te.TaskEither<DisconnectMongoDbClientError, void> {
  return pipe(
    te.fromIO(logger.infoIo('MongoDB client start disconnecting from MongoDB')),
    te.chain(() =>
      te.tryCatch(
        () => client.disconnect(),
        createErrorFromUnknown(DisconnectMongoDbClientError, 'DISCONNECT_CLIENT_ERROR'),
      ),
    ),
    te.chainIOK(() => logger.infoIo('MongoDB client successfully disconnected')),
    te.orElseFirstIOK((error) =>
      logger.errorIo({ error }, 'MongoDB client failed to disconnect a connection from MongoDB'),
    ),
  );
}
