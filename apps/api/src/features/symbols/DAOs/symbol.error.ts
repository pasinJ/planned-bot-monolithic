import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { implementZodSchema } from '#shared/errors/utils.js';

export type SymbolDaoError<Type extends SymbolDaoErrorType = SymbolDaoErrorType> = AppError<
  SymbolDaoErrorName,
  Type
>;

type SymbolDaoErrorName = typeof symbolDaoErrorName;
export const symbolDaoErrorName = 'SymbolDaoError';
type SymbolDaoErrorType = (typeof symbolDaoErrorType)[number];
export const symbolDaoErrorType = [
  'BuildDaoFailed',
  'AddFailed',
  'GetAllFailed',
  'ExistByExchangeFailed',
  'ExistByNameAndExchangeFailed',
] as const;

export function createSymbolDaoError<Type extends SymbolDaoError['type']>(
  type: Type,
  message: string,
  cause?: SymbolDaoError['cause'],
): SymbolDaoError<Type> {
  return createAppError({ name: symbolDaoErrorName, type, message, cause }, createSymbolDaoError);
}

export function isSymbolDaoError(input: unknown): input is SymbolDaoError {
  return implementZodSchema<SymbolDaoError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(symbolDaoErrorName),
        type: z.enum(symbolDaoErrorType),
      }),
    )
    .safeParse(input).success;
}
