import { z } from 'zod';

import { isError, isString } from '#shared/utils/typeGuards.js';

import { AppError, GeneralCause, appErrorSchema, createAppError } from './appError.js';
import { defineCauseSchema, implementZodSchema } from './utils.js';

export type ExternalError = AppError<ExternalErrorName, never, Error | string>;

type ExternalErrorName = typeof externalErrorName;
const externalErrorName = 'ExternalError';

export function createExternalError({
  message = 'Error happened from thrid-party library',
  cause,
}: {
  message?: string;
  cause: ExternalError['cause'];
}): ExternalError {
  return createAppError({ name: externalErrorName, message, cause }, createExternalError) as ExternalError;
}

export function isExternalError(input: unknown): input is ExternalError {
  return implementZodSchema<ExternalError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(externalErrorName),
        type: z.never().optional(),
        cause: defineCauseSchema([isError, isString]),
      }),
    )
    .safeParse(input).success;
}

export function createErrorFromUnknown<
  Name extends string,
  Type extends string | undefined,
  Cause extends ExternalError | GeneralCause,
  ReturnType = ExternalError | undefined extends Cause ? AppError<Name, Type, Cause> : never, // Cause of the error should include ExternalError
>(appError: AppError<Name, Type, Cause>) {
  return (cause: unknown): ReturnType => {
    return (
      isString(cause) || isError(cause)
        ? appError.setFactoryContext(createErrorFromUnknown).setCause(createExternalError({ cause }) as Cause)
        : appError
            .setFactoryContext(createErrorFromUnknown)
            .setCause(createExternalError({ cause: 'Unexpected cause (created from unknown)' }) as Cause)
    ) as ReturnType;
  };
}
