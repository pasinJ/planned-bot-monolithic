import { z } from 'zod';

import { CreateSymbolModelError } from '#features/symbols/data-models/symbol-model/index.js';
import { HttpError, isHttpError } from '#infra/http/client.error.js';
import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { ExternalError, isExternalError } from '#shared/errors/externalError.js';
import { isGeneralError } from '#shared/errors/generalError.js';
import { defineCauseSchema, implementZodSchema } from '#shared/errors/utils.js';

export type BnbServiceError<Type extends BnbServiceErrorType = BnbServiceErrorType> = AppError<
  BnbServiceErrorName,
  Type,
  HttpError | CreateSymbolModelError | ExternalError | undefined
>;

type BnbServiceErrorName = (typeof bnbServiceErrorName)[number];
const bnbServiceErrorName = 'BnbServiceError' as const;
type BnbServiceErrorType = (typeof bnbServiceErrorType)[number];
const bnbServiceErrorType = ['CreateServiceFailed', 'GetSpotSymbolsFailed'] as const;

export function createBnbServiceError<Type extends BnbServiceError['type']>(
  type: Type,
  message: string,
  cause?: BnbServiceError['cause'],
): BnbServiceError<Type> {
  return createAppError({ name: bnbServiceErrorName, type, message, cause }, createBnbServiceError);
}

export function isBnbServiceError(input: unknown): input is BnbServiceError {
  return implementZodSchema<BnbServiceError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(bnbServiceErrorName),
        type: z.enum(bnbServiceErrorType),
        cause: defineCauseSchema([isHttpError, isGeneralError, isExternalError]).optional(),
      }),
    )
    .safeParse(input).success;
}
