import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError';
import { ExternalError, isExternalError } from '#shared/errors/externalError';
import { defineCauseSchema, implementZodSchema } from '#shared/errors/utils';
import { SchemaValidationError, isSchemaValidationError } from '#shared/utils/zod';

export type HttpError<Type extends HttpErrorType = HttpErrorType> = AppError<
  HttpErrorName,
  Type,
  HttpErrorCause
>;

type HttpErrorName = typeof httpErrorName;
const httpErrorName = 'HttpError';
type HttpErrorType = (typeof httpErrorType)[number];
const httpErrorType = [
  'InvalidRequest',
  'Unauthorized',
  'Forbidded',
  'NotFound',
  'BussinessError',
  'ClientSideError',
  'InternalServerError',
  'ServerSideError',
  'NoResponse',
  'SendingFailed',
  'InvalidResponse',
  'UnhandledError',
] as const;
type HttpErrorCause = SchemaValidationError | ExternalError;

export function createHttpError<Type extends HttpError['type']>(
  type: Type,
  message: string,
  cause: HttpError['cause'],
): HttpError<Type> {
  return createAppError({ name: httpErrorName, type, message, cause }, createHttpError);
}

export function isHttpError(input: unknown): input is HttpError {
  return implementZodSchema<HttpError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(httpErrorName),
        type: z.enum(httpErrorType),
        cause: defineCauseSchema([isSchemaValidationError, isExternalError]),
      }),
    )
    .safeParse(input).success;
}
