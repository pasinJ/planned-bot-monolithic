import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { ExternalError, isExternalError } from '#shared/errors/externalError.js';
import { defineCauseSchema, implementZodSchema } from '#shared/errors/utils.js';

export type BtStrategyModelDaoError<Type extends BtStrategyModelDaoErrorType = BtStrategyModelDaoErrorType> =
  AppError<BtStrategyModelDaoErrorName, Type, BtStrategyModelDaoErrorCause>;
type BtStrategyModelDaoErrorName = typeof btStrategyModelDaoErrorName;
export const btStrategyModelDaoErrorName = 'BtStrategyModelDaoError';
type BtStrategyModelDaoErrorType = (typeof btStrategyModelDaoErrorType)[number];
export const btStrategyModelDaoErrorType = ['CreateDaoFailed', 'ExistByIdFailed', 'AddFailed'] as const;
type BtStrategyModelDaoErrorCause = ExternalError | undefined;

export function createBtStrategyModelDaoError<Type extends BtStrategyModelDaoError['type']>(
  type: Type,
  message: string,
  cause?: BtStrategyModelDaoError['cause'],
): BtStrategyModelDaoError<Type> {
  return createAppError(
    { name: btStrategyModelDaoErrorName, type, message, cause },
    createBtStrategyModelDaoError,
  );
}

export function isBtStrategyModelDaoError(input: unknown): input is BtStrategyModelDaoError {
  return implementZodSchema<BtStrategyModelDaoError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(btStrategyModelDaoErrorName),
        type: z.enum(btStrategyModelDaoErrorType),
        cause: defineCauseSchema([isExternalError]).optional(),
      }),
    )
    .safeParse(input).success;
}
