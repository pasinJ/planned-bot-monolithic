import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from './appError.js';
import { implementZodSchema } from './utils.js';

export type BusinessError<Type extends string = string> = AppError<BusinessErrorName, Type>;

type BusinessErrorName = typeof businessErrorName;
const businessErrorName = 'BusinessError';

export function createBusinessError<Type extends BusinessError['type']>(
  type: Type,
  message: string,
  cause?: BusinessError['cause'],
): BusinessError<Type> {
  return createAppError({ name: businessErrorName, type, message, cause }, createBusinessError);
}

export function isBusinessError(input: unknown): input is BusinessError {
  return implementZodSchema<BusinessError>()
    .with(appErrorSchema.extend({ name: z.literal(businessErrorName), type: z.string() }))
    .safeParse(input).success;
}
