import { z } from 'zod';

import { SymbolDomainError, isSymbolDomainError } from '#features/symbols/domain/symbol.error.js';
import { HttpError, isHttpError } from '#infra/http/client.error.js';
import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { ExternalError, isExternalError } from '#shared/errors/externalError.js';
import { defineCauseSchema, implementZodSchema } from '#shared/errors/utils.js';

export type BnbServiceError<Type extends BnbServiceErrorType = BnbServiceErrorType> = AppError<
  BnbServiceErrorName,
  Type,
  HttpError | SymbolDomainError | ExternalError | undefined
>;

type BnbServiceErrorName = (typeof bnbServiceErrorName)[number];
const bnbServiceErrorName = 'BnbServiceError' as const;
type BnbServiceErrorType = (typeof bnbServiceErrorType)[number];
const bnbServiceErrorType = ['CreateBnbServiceError', 'GetBnbSpotSymbolsError'] as const;

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
        cause: defineCauseSchema([isHttpError, isSymbolDomainError, isExternalError]).optional(),
      }),
    )
    .safeParse(input).success;
}
