import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { implementZodSchema } from '#shared/errors/utils.js';

export type BtExecutionDaoError<Type extends string = string> = AppError<BtExecutionDaoErrorName, Type>;

type BtExecutionDaoErrorName = typeof btExecutionDaoErrorName;
export const btExecutionDaoErrorName = 'BtExecutionDaoError';

export function createBtExecutionDaoError<Type extends BtExecutionDaoError['type']>(
  type: Type,
  message: string,
  cause?: BtExecutionDaoError['cause'],
): BtExecutionDaoError<Type> {
  return createAppError({ name: btExecutionDaoErrorName, type, message, cause }, createBtExecutionDaoError);
}

export function isBtExecutionDaoError(input: unknown): input is BtExecutionDaoError {
  return implementZodSchema<BtExecutionDaoError>()
    .with(appErrorSchema.extend({ name: z.literal(btExecutionDaoErrorName), type: z.string() }))
    .safeParse(input).success;
}
