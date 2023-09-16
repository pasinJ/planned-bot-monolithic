import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { implementZodSchema } from '#shared/errors/utils.js';

export type BtStrategyDaoError<Type extends BtStrategyDaoErrorType = BtStrategyDaoErrorType> = AppError<
  BtStrategyDaoErrorName,
  Type
>;

type BtStrategyDaoErrorName = typeof btStrategyDaoErrorName;
export const btStrategyDaoErrorName = 'BtStrategyDaoError';
type BtStrategyDaoErrorType = (typeof btStrategyDaoErrorType)[number];
export const btStrategyDaoErrorType = [
  'BuildDaoFailed',
  'ExistByIdFailed',
  'AddFailed',
  'GetByIdFailed',
  'NotExist',
] as const;

export function createBtStrategyDaoError<Type extends BtStrategyDaoError['type']>(
  type: Type,
  message: string,
  cause?: BtStrategyDaoError['cause'],
): BtStrategyDaoError<Type> {
  return createAppError({ name: btStrategyDaoErrorName, type, message, cause }, createBtStrategyDaoError);
}

export function isBtStrategyDaoError(input: unknown): input is BtStrategyDaoError {
  return implementZodSchema<BtStrategyDaoError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(btStrategyDaoErrorName),
        type: z.enum(btStrategyDaoErrorType),
      }),
    )
    .safeParse(input).success;
}
