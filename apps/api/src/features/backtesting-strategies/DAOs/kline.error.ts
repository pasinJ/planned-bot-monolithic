import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { implementZodSchema } from '#shared/errors/utils.js';

export type KlineDaoError<Type extends KlineDaoErrorType = KlineDaoErrorType> = AppError<
  KlineDaoErrorName,
  Type
>;

type KlineDaoErrorName = typeof klineDaoErrorName;
export const klineDaoErrorName = 'KlineDaoError';
type KlineDaoErrorType = (typeof klineDaoErrorType)[number];
export const klineDaoErrorType = ['BuildDaoFailed', 'AddFailed'] as const;

export function createKlineDaoError<Type extends KlineDaoError['type']>(
  type: Type,
  message: string,
  cause?: KlineDaoError['cause'],
): KlineDaoError<Type> {
  return createAppError({ name: klineDaoErrorName, type, message, cause }, createKlineDaoError);
}

export function isKlineDaoError(input: unknown): input is KlineDaoError {
  return implementZodSchema<KlineDaoError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(klineDaoErrorName),
        type: z.enum(klineDaoErrorType),
      }),
    )
    .safeParse(input).success;
}
