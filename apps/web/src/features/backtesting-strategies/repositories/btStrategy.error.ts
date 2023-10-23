import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError';
import { implementZodSchema } from '#shared/errors/utils';

export type BtStrategyRepoError<Type extends string = string> = AppError<BtStrategyRepoErrorName, Type>;

type BtStrategyRepoErrorName = typeof btStrategyRepoErrorName;
const btStrategyRepoErrorName = 'BtStrategyRepoError';

export function createBtStrategyRepoError<Type extends string>(
  type: Type,
  message: string,
  cause: BtStrategyRepoError['cause'],
): BtStrategyRepoError<Type> {
  return createAppError({ name: btStrategyRepoErrorName, type, message, cause }, createBtStrategyRepoError);
}

export function isBtStrategyRepoError(input: unknown): input is BtStrategyRepoError {
  return implementZodSchema<BtStrategyRepoError>()
    .with(appErrorSchema.extend({ name: z.literal(btStrategyRepoErrorName), type: z.string() }))
    .safeParse(input).success;
}
