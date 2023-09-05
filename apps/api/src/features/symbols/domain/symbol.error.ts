import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { defineCauseSchema, implementZodSchema } from '#shared/errors/utils.js';
import { SchemaValidationError, isSchemaValidationError } from '#shared/utils/zod.js';

export type SymbolDomainError<Type extends SymbolDomainErrorType = SymbolDomainErrorType> = AppError<
  SymbolDomainErrorName,
  Type,
  SymbolDomainErrorCause
>;

type SymbolDomainErrorName = typeof symbolDomainErrorName;
const symbolDomainErrorName = 'SymbolDomainError';
type SymbolDomainErrorType = (typeof symbolDomainErrorType)[number];
const symbolDomainErrorType = ['CreateSymbolError'] as const;
type SymbolDomainErrorCause = SchemaValidationError;

export function createSymbolDomainError<Type extends SymbolDomainErrorType>(
  type: Type,
  message: string,
  cause: SymbolDomainError['cause'],
): SymbolDomainError<Type> {
  return createAppError({ name: symbolDomainErrorName, type, message, cause }, createSymbolDomainError);
}

export function isSymbolDomainError(input: unknown): input is SymbolDomainError {
  return implementZodSchema<SymbolDomainError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(symbolDomainErrorName),
        type: z.enum(symbolDomainErrorType),
        cause: defineCauseSchema([isSchemaValidationError]),
      }),
    )
    .safeParse(input).success;
}
