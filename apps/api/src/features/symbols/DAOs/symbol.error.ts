import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { implementZodSchema } from '#shared/errors/utils.js';

export type SymbolDaoError<Type extends string = string> = AppError<SymbolDaoErrorName, Type>;

type SymbolDaoErrorName = typeof symbolDaoErrorName;
export const symbolDaoErrorName = 'SymbolDaoError';

export function createSymbolDaoError<Type extends SymbolDaoError['type']>(
  type: Type,
  message: string,
  cause?: SymbolDaoError['cause'],
): SymbolDaoError<Type> {
  return createAppError({ name: symbolDaoErrorName, type, message, cause }, createSymbolDaoError);
}

export function isSymbolDaoError(input: unknown): input is SymbolDaoError {
  return implementZodSchema<SymbolDaoError>()
    .with(appErrorSchema.extend({ name: z.literal(symbolDaoErrorName), type: z.string() }))
    .safeParse(input).success;
}
