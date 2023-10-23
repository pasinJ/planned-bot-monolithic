import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError';
import { implementZodSchema } from '#shared/errors/utils';

export type KlineRepoError<Type extends string = string> = AppError<KlineRepoErrorName, Type>;

type KlineRepoErrorName = typeof klineRepoErrorName;
const klineRepoErrorName = 'KlineRepoError';

export function createKlineRepoError<Type extends string>(
  type: Type,
  message: string,
  cause?: KlineRepoError['cause'],
): KlineRepoError<Type> {
  return createAppError({ name: klineRepoErrorName, type, message, cause }, createKlineRepoError);
}

export function isKlineRepoError(input: unknown): input is KlineRepoError {
  return implementZodSchema<KlineRepoError>()
    .with(appErrorSchema.extend({ name: z.literal(klineRepoErrorName), type: z.string() }))
    .safeParse(input).success;
}
