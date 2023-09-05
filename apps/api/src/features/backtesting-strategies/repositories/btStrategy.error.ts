import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { ExternalError, isExternalError } from '#shared/errors/externalError.js';
import { defineCauseSchema, implementZodSchema } from '#shared/errors/utils.js';

export type BtStrategyRepoError<Type extends BtStrategyRepoErrorType = BtStrategyRepoErrorType> = AppError<
  BtStrategyRepoErrorName,
  Type,
  BtStrategyRepoErrorCause
>;

type BtStrategyRepoErrorName = typeof btStrategyRepoErrorName;
const btStrategyRepoErrorName = 'BtStrategyRepoError';
type BtStrategyRepoErrorType = (typeof btStrategyRepoErrorType)[number];
const btStrategyRepoErrorType = ['CreateBtStrategyRepoError', 'AddBtStrategyError'] as const;
type BtStrategyRepoErrorCause = ExternalError | undefined;

export function createBtStrategyRepoError<Type extends BtStrategyRepoErrorType>(
  type: Type,
  message: string,
  cause?: BtStrategyRepoError['cause'],
): BtStrategyRepoError<Type> {
  return createAppError({ name: btStrategyRepoErrorName, type, message, cause }, createBtStrategyRepoError);
}

export function isBtStrategyRepoError(input: unknown): input is BtStrategyRepoError {
  return implementZodSchema<BtStrategyRepoError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(btStrategyRepoErrorName),
        type: z.enum(btStrategyRepoErrorType),
        cause: defineCauseSchema([isExternalError]).optional(),
      }),
    )
    .safeParse(input).success;
}
