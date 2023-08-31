import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import mongoose, { Mongoose } from 'mongoose';

import { LoggerIo } from '#infra/logging.js';
import { getMongoDbConfig } from '#shared/config/mongoDb.js';
import { CustomError, ExternalError, createErrorFromUnknown } from '#shared/error.js';

export function createMongoDbClient(logger: LoggerIo): te.TaskEither<CreateMongoDbClientError, Mongoose> {
  const { URI } = getMongoDbConfig();
  return pipe(
    te.fromIO(logger.infoIo('MongoDB client start connecting to MongoDB')),
    te.chain(() =>
      te.tryCatch(() => mongoose.connect(URI), createErrorFromUnknown(CreateMongoDbClientError)),
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
      te.tryCatch(() => client.disconnect(), createErrorFromUnknown(DisconnectMongoDbClientError)),
    ),
    te.chainIOK(() => logger.infoIo('MongoDB client successfully disconnected')),
    te.orElseFirstIOK((error) =>
      logger.errorIo({ error }, 'MongoDB client failed to disconnect a connection from MongoDB'),
    ),
  );
}

export class CreateMongoDbClientError extends CustomError<'CREATE_CLIENT_ERROR', ExternalError>(
  'CREATE_CLIENT_ERROR',
  'Error happened when try to create a MongoDb client',
) {}
export class DisconnectMongoDbClientError extends CustomError<'DISCONNECT_CLIENT_ERROR', ExternalError>(
  'DISCONNECT_CLIENT_ERROR',
  'Error happened when try to disconnect a MongoDb client',
) {}
