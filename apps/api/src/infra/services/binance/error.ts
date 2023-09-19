import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { implementZodSchema } from '#shared/errors/utils.js';

export type BnbServiceError<Type extends BnbServiceErrorType = BnbServiceErrorType> = AppError<
  BnbServiceErrorName,
  Type
>;

type BnbServiceErrorName = (typeof bnbServiceErrorName)[number];
const bnbServiceErrorName = 'BnbServiceError' as const;
type BnbServiceErrorType = (typeof bnbServiceErrorType)[number];
const bnbServiceErrorType = [
  'CreateServiceFailed',
  'GetSpotSymbolsFailed',
  'InvalidRequest',
  'GetKlinesFromMonthlyFilesFailed',
  'GetKlinesFromDailyFilesFailed',
  'GetKlinesFromApiFailed',
  'GetKlinesForBtFailed',
] as const;

export function createBnbServiceError<Type extends BnbServiceError['type']>(
  type: Type,
  message: string,
  cause?: BnbServiceError['cause'],
): BnbServiceError<Type> {
  return createAppError({ name: bnbServiceErrorName, type, message, cause }, createBnbServiceError);
}

export function isBnbServiceError(input: unknown): input is BnbServiceError {
  return implementZodSchema<BnbServiceError>()
    .with(appErrorSchema.extend({ name: z.literal(bnbServiceErrorName), type: z.enum(bnbServiceErrorType) }))
    .safeParse(input).success;
}
