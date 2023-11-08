import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { implementZodSchema } from '#shared/errors/utils.js';

export type FileServiceError<Type extends string = string> = AppError<FileServiceErrorName, Type>;
type FileServiceErrorName = typeof fileServiceErrorName;
export const fileServiceErrorName = 'FileServiceError';

export function createFileServiceError<Type extends FileServiceError['type']>(
  type: Type,
  message: string,
  cause?: FileServiceError['cause'],
): FileServiceError<Type> {
  return createAppError({ name: fileServiceErrorName, type, message, cause }, createFileServiceError);
}

export function isFileServiceError(input: unknown): input is FileServiceError {
  return implementZodSchema<FileServiceError>()
    .with(appErrorSchema.extend({ name: z.literal(fileServiceErrorName), type: z.string() }))
    .safeParse(input).success;
}
