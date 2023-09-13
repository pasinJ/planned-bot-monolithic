import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { ExternalError, isExternalError } from '#shared/errors/externalError.js';
import { defineCauseSchema, implementZodSchema } from '#shared/errors/utils.js';

export type SymbolModelDaoError<Type extends SymbolModelDaoErrorType = SymbolModelDaoErrorType> = AppError<
  SymbolModelDaoErrorName,
  Type,
  SymbolModelDaoErrorCause
>;
type SymbolModelDaoErrorName = typeof symbolModelDaoErrorName;
export const symbolModelDaoErrorName = 'SymbolModelDaoError';
type SymbolModelDaoErrorType = (typeof symbolModelDaoErrorType)[number];
export const symbolModelDaoErrorType = [
  'CreateDaoFailed',
  'AddFailed',
  'GetAllFailed',
  'ExistByExchangeFailed',
] as const;
type SymbolModelDaoErrorCause = ExternalError | undefined;

export function createSymbolModelDaoError<Type extends SymbolModelDaoError['type']>(
  type: Type,
  message: string,
  cause?: SymbolModelDaoError['cause'],
): SymbolModelDaoError<Type> {
  return createAppError({ name: symbolModelDaoErrorName, type, message, cause }, createSymbolModelDaoError);
}

export function isSymbolModelDaoError(input: unknown): input is SymbolModelDaoError {
  return implementZodSchema<SymbolModelDaoError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(symbolModelDaoErrorName),
        type: z.enum(symbolModelDaoErrorType),
        cause: defineCauseSchema([isExternalError]).optional(),
      }),
    )
    .safeParse(input).success;
}
