import { z } from 'zod';

import { AppError, appErrorSchema, createAppError, isAppError } from './appError.js';
import { defineCauseSchema, implementZodSchema } from './utils.js';

export type GeneralError<
  Type extends string = string,
  Cause extends Error | undefined = undefined,
> = AppError<GeneralErrorName, Type, Cause>;

type GeneralErrorName = typeof generalErrorName;
const generalErrorName = 'GeneralError';

export function createGeneralError<Type extends string = string, Cause extends Error | undefined = undefined>(
  info: { type: Type; message: string } & (undefined extends Cause ? { cause?: Cause } : { cause: Cause }),
): GeneralError<Type, Cause> {
  return createAppError(
    { name: generalErrorName, type: info.type, message: info.message, cause: info.cause },
    createGeneralError,
  ) as GeneralError<Type, Cause>;
}

export function isGeneralError(input: unknown): input is GeneralError {
  return implementZodSchema<GeneralError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(generalErrorName),
        type: z.string(),
        cause: defineCauseSchema([isAppError]).optional(),
      }),
    )
    .safeParse(input).success;
}
