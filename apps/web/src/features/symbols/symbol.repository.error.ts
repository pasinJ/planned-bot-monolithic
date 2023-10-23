import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError';
import { implementZodSchema } from '#shared/errors/utils';

export type SymbolRepoError<Type extends string = string> = AppError<SymbolRepoErrorName, Type>;

type SymbolRepoErrorName = typeof symbolRepoErrorName;
const symbolRepoErrorName = 'SymbolRepoError';

export function createSymbolRepoError<Type extends string>(
  type: Type,
  message: string,
  cause?: SymbolRepoError['cause'],
): SymbolRepoError<Type> {
  return createAppError({ name: symbolRepoErrorName, type, message, cause }, createSymbolRepoError);
}

export function isSymbolRepoError(input: unknown): input is SymbolRepoError {
  return implementZodSchema<SymbolRepoError>()
    .with(appErrorSchema.extend({ name: z.literal(symbolRepoErrorName), type: z.string() }))
    .safeParse(input).success;
}
