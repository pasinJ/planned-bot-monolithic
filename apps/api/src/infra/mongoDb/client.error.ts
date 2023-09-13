import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { ExternalError, isExternalError } from '#shared/errors/externalError.js';
import { defineCauseSchema, implementZodSchema } from '#shared/errors/utils.js';

export type MongoDbClientError<Type extends MongoDbClientErrorType = MongoDbClientErrorType> = AppError<
  MongoDbClientErrorName,
  Type,
  ExternalError | undefined
>;

type MongoDbClientErrorName = typeof mongoDbClientErrorName;
const mongoDbClientErrorName = 'MongoDbClientError' as const;
type MongoDbClientErrorType = (typeof mongoDbClientErrorType)[number];
const mongoDbClientErrorType = ['CreateClientFailed', 'DisconnectFailed'] as const;

export function createMongoDbClientError<Type extends MongoDbClientError['type']>(
  type: Type,
  message: string,
  cause?: MongoDbClientError['cause'],
): MongoDbClientError<Type> {
  return createAppError({ name: mongoDbClientErrorName, type, message, cause }, createMongoDbClientError);
}

export function isMongoDbClientError(input: unknown): input is MongoDbClientError {
  return implementZodSchema<MongoDbClientError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(mongoDbClientErrorName),
        type: z.enum(mongoDbClientErrorType),
        cause: defineCauseSchema([isExternalError]).optional(),
      }),
    )
    .safeParse(input).success;
}
