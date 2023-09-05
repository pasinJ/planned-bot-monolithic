import { z } from 'zod';

import { HttpError, isHttpError } from '#infra/httpClient.error';
import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError';
import { defineCauseSchema, implementZodSchema } from '#shared/errors/utils';

export type SymbolRepoError<Type extends SymbolRepoErrorType = SymbolRepoErrorType> = AppError<
  SymbolRepoErrorName,
  Type,
  SymbolRepoErrorCause
>;

type SymbolRepoErrorName = typeof symbolRepoErrorName;
const symbolRepoErrorName = 'SymbolRepoError';
type SymbolRepoErrorType = (typeof symbolRepoErrorType)[number];
const symbolRepoErrorType = ['GetSymbolsError'] as const;
type SymbolRepoErrorCause = HttpError;

export function createSymbolRepoError<Type extends SymbolRepoErrorType>(
  type: Type,
  message: string,
  cause: SymbolRepoError['cause'],
): SymbolRepoError<Type> {
  return createAppError({ name: symbolRepoErrorName, type, message, cause }, createSymbolRepoError);
}

export function isSymbolRepoError(input: unknown): input is SymbolRepoError {
  return implementZodSchema<SymbolRepoError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(symbolRepoErrorName),
        type: z.enum(symbolRepoErrorType),
        cause: defineCauseSchema([isHttpError]),
      }),
    )
    .safeParse(input).success;
}
