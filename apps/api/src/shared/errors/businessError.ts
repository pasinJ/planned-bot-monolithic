import { z } from 'zod';

import { AppError, appErrorSchema, createAppError, isAppError } from './appError.js';
import { defineCauseSchema, implementZodSchema } from './utils.js';

export type BusinessError<
  Type extends string = string,
  Cause extends AppError | undefined = undefined,
> = AppError<BusinessErrorName, Type, Cause>;

type BusinessErrorName = typeof businessErrorName;
const businessErrorName = 'BusinessError';

export function createBusinessError<Type extends BusinessError['type'], Cause extends BusinessError['cause']>(
  type: Type,
  message: string,
  cause?: Cause,
): BusinessError<Type, Cause> {
  return createAppError(
    { name: businessErrorName, type, message, cause },
    createBusinessError,
  ) as BusinessError<Type, Cause>;
}

export function isBusinessError(input: unknown): input is BusinessError {
  return implementZodSchema<BusinessError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(businessErrorName),
        type: z.string(),
        cause: defineCauseSchema([isAppError]).optional(),
      }),
    )
    .safeParse(input).success;
}
