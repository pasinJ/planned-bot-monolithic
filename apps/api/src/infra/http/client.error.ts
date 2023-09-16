import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { implementZodSchema } from '#shared/errors/utils.js';

export type HttpError<Type extends HttpErrorType = HttpErrorType> = AppError<HttpErrorName, Type>;

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

export function createHttpError<Type extends HttpError['type']>(
  type: Type,
  message: string,
  cause: HttpError['cause'],
): HttpError<Type> {
  return createAppError({ name: httpErrorName, type, message, cause }, createHttpError);
}

export function isHttpError(input: unknown): input is HttpError {
  return implementZodSchema<HttpError>()
    .with(appErrorSchema.extend({ name: z.literal(httpErrorName), type: z.enum(httpErrorType) }))
    .safeParse(input).success;
}
