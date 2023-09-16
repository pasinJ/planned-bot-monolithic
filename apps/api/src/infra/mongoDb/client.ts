import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import mongoose, { Mongoose } from 'mongoose';

import { LoggerIo } from '#infra/logging.js';
import { getMongoDbConfig } from '#infra/mongoDb/config.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { MongoDbClientError, createMongoDbClientError } from './client.error.js';

export function buildMongoDbClient(
  logger: LoggerIo,
): te.TaskEither<MongoDbClientError<'BuildClientFailed'>, Mongoose> {
  const { URI } = getMongoDbConfig();
  return pipe(
    te.fromIO(logger.infoIo('MongoDB client start connecting to MongoDB')),
    te.chain(() =>
      te.tryCatch(
        () => mongoose.connect(URI),
        createErrorFromUnknown(
          createMongoDbClientError('BuildClientFailed', 'Creating MongoDb client failed'),
        ),
      ),
    ),
    te.chainFirstIOK(() => logger.infoIo('MongoDB client connected')),
  );
}

export function disconnectMongoDbClient(
  client: Mongoose,
  logger: LoggerIo,
): te.TaskEither<MongoDbClientError<'DisconnectFailed'>, void> {
  return pipe(
    te.fromIO(logger.infoIo('MongoDB client start disconnecting from MongoDB')),
    te.chain(() =>
      te.tryCatch(
        () => client.disconnect(),
        createErrorFromUnknown(
          createMongoDbClientError('DisconnectFailed', 'Disconnecting MongoDb client failed'),
        ),
      ),
    ),
    te.chainIOK(() => logger.infoIo('MongoDB client successfully disconnected')),
    te.orElseFirstIOK((error) =>
      logger.errorIo({ error }, 'MongoDB client failed to disconnect a connection from MongoDB'),
    ),
  );
}
