import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from './appError.js';
import { implementZodSchema } from './utils.js';

export type GeneralError<Type extends string = string> = AppError<GeneralErrorName, Type>;

type GeneralErrorName = typeof generalErrorName;
const generalErrorName = 'GeneralError';

export function createGeneralError<Type extends GeneralError['type']>(
  type: Type,
  message: string,
  cause?: GeneralError['cause'],
): GeneralError<Type> {
  return createAppError({ name: generalErrorName, type, message, cause }, createGeneralError);
}

export function isGeneralError(input: unknown): input is GeneralError {
  return implementZodSchema<GeneralError>()
    .with(appErrorSchema.extend({ name: z.literal(generalErrorName), type: z.string() }))
    .safeParse(input).success;
}
