import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { defineCauseSchema, implementZodSchema } from '#shared/errors/utils.js';
import { SchemaValidationError, isSchemaValidationError } from '#shared/utils/zod.js';

export type BtStrategyDomainError<Type extends BtStrategyDomainErrorType = BtStrategyDomainErrorType> =
  AppError<BtStrategyDomainErrorName, Type, BtStrategyDomainErrorCause>;

type BtStrategyDomainErrorName = typeof btStrategyDomainErrorName;
const btStrategyDomainErrorName = 'BtStrategyDomainError';
type BtStrategyDomainErrorType = (typeof btStrategyDomainErrorType)[number];
const btStrategyDomainErrorType = ['CreateBtStrategyError'] as const;
type BtStrategyDomainErrorCause = SchemaValidationError;

export function createBtStrategyDomainError<Type extends BtStrategyDomainErrorType>(
  type: Type,
  message: string,
  cause: BtStrategyDomainError['cause'],
): BtStrategyDomainError<Type> {
  return createAppError(
    { name: btStrategyDomainErrorName, type, message, cause },
    createBtStrategyDomainError,
  );
}

export function isBtStrategyDomainError(input: unknown): input is BtStrategyDomainError {
  return implementZodSchema<BtStrategyDomainError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(btStrategyDomainErrorName),
        type: z.enum(btStrategyDomainErrorType),
        cause: defineCauseSchema([isSchemaValidationError]),
      }),
    )
    .safeParse(input).success;
}
