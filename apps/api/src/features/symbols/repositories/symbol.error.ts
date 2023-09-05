import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { ExternalError, isExternalError } from '#shared/errors/externalError.js';
import { defineCauseSchema, implementZodSchema } from '#shared/errors/utils.js';

export type SymbolRepoError<Type extends SymbolRepoErrorType = SymbolRepoErrorType> = AppError<
  SymbolRepoErrorName,
  Type,
  SymbolRepoErrorCause
>;

type SymbolRepoErrorName = typeof symbolRepoErrorName;
const symbolRepoErrorName = 'SymbolRepoError';
type SymbolRepoErrorType = (typeof symbolRepoErrorType)[number];
const symbolRepoErrorType = [
  'CreateSymbolRepoError',
  'AddSymbolError',
  'GetAllSymbolsError',
  'CountAllSymbolsError',
] as const;
type SymbolRepoErrorCause = ExternalError | undefined;

export function createSymbolRepoError<Type extends SymbolRepoErrorType>(
  type: Type,
  message: string,
  cause?: SymbolRepoError['cause'],
): SymbolRepoError<Type> {
  return createAppError({ name: symbolRepoErrorName, type, message, cause }, createSymbolRepoError);
}

export function isSymbolRepoError(input: unknown): input is SymbolRepoError {
  return implementZodSchema<SymbolRepoError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(symbolRepoErrorName),
        type: z.enum(symbolRepoErrorType),
        cause: defineCauseSchema([isExternalError]).optional(),
      }),
    )
    .safeParse(input).success;
}
