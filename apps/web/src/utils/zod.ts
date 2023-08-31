import * as e from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function.js';
import { ZodTypeDef, z } from 'zod';
import { ValidationError, fromZodError, isValidationErrorLike } from 'zod-validation-error';

import { CustomError } from '#utils/error';

export class SchemaValidationError extends CustomError<SchemaValidationErrorName, SchemaValidationErrorCause>(
  'MISMATCH_SCHEMA',
  'Error happened when try to parse value with zod schema',
) {}
type SchemaValidationErrorName = 'MISMATCH_SCHEMA' | 'SCHEMA_VALIDATION_FAILED';
type SchemaValidationErrorCause = ValidationError | Error;

export function parseWithZod<
  T extends z.ZodType<Output, Def, Input>,
  Output,
  Def extends ZodTypeDef = ZodTypeDef,
  Input = Output,
>(schema: T, message: string): (value: unknown) => e.Either<SchemaValidationError, z.output<T>>;
export function parseWithZod<
  T extends z.ZodType<Output, Def, Input>,
  Output,
  Def extends ZodTypeDef = ZodTypeDef,
  Input = Output,
>(schema: T, message: string, value: unknown): e.Either<SchemaValidationError, z.output<T>>;
export function parseWithZod<
  T extends z.ZodType<Output, Def, Input>,
  Output,
  Def extends ZodTypeDef = ZodTypeDef,
  Input = Output,
>(schema: T, message: string, value?: unknown) {
  const internalFn = (value: unknown): e.Either<SchemaValidationError, z.output<T>> =>
    pipe(
      e.tryCatch(() => schema.parse(value), toValidationError),
      e.mapLeft((error) => {
        return isValidationErrorLike(error)
          ? new SchemaValidationError('MISMATCH_SCHEMA', message).causedBy(error)
          : new SchemaValidationError(
              'SCHEMA_VALIDATION_FAILED',
              'Unexpected error happened when try to parse with zod',
            ).causedBy(error);
      }),
    );

  if (value) return internalFn(value);
  else return internalFn;
}

function toValidationError(error: unknown): ValidationError | Error {
  if (error instanceof z.ZodError) return fromZodError(error);
  else if (error instanceof Error) return error;
  else return new Error('Unknown error happend when try to parse with zod', { cause: error });
}
