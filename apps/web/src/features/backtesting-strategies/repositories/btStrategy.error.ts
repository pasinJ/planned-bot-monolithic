import { z } from 'zod';

import { HttpError, isHttpError } from '#infra/httpClient.error';
import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError';
import { defineCauseSchema, implementZodSchema } from '#shared/errors/utils';
import { SchemaValidationError, isSchemaValidationError } from '#shared/utils/zod';

export type BtStrategyRepoError<Type extends BtStrategyRepoErrorType = BtStrategyRepoErrorType> = AppError<
  BtStrategyRepoErrorName,
  Type,
  BtStrategyRepoErrorCause
>;

type BtStrategyRepoErrorName = typeof btStrategyRepoErrorName;
const btStrategyRepoErrorName = 'BtStrategyRepoError';
type BtStrategyRepoErrorType = (typeof btStrategyRepoErrorType)[number];
const btStrategyRepoErrorType = ['GetStrategiesError', 'AddBtStrategyError'] as const;
type BtStrategyRepoErrorCause = HttpError | SchemaValidationError;

export function createBtStrategyRepoError<Type extends BtStrategyRepoErrorType>(
  type: Type,
  message: string,
  cause: BtStrategyRepoError['cause'],
): BtStrategyRepoError<Type> {
  return createAppError({ name: btStrategyRepoErrorName, type, message, cause }, createBtStrategyRepoError);
}

export function isBtStrategyRepoError(input: unknown): input is BtStrategyRepoError {
  return implementZodSchema<BtStrategyRepoError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(btStrategyRepoErrorName),
        type: z.enum(btStrategyRepoErrorType),
        cause: defineCauseSchema([isHttpError, isSchemaValidationError]),
      }),
    )
    .safeParse(input).success;
}
