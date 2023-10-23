import * as e from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { isNotNil } from 'ramda';
import { z } from 'zod';
import { ValidationError, fromZodError, isValidationErrorLike } from 'zod-validation-error';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError';
import { implementZodSchema } from '#shared/errors/utils';

export type SchemaValidationError<Type extends SchemaValidationErrorType = SchemaValidationErrorType> =
  AppError<SchemaValidationErrorName, Type>;

type SchemaValidationErrorName = typeof schemaValidationErrorName;
const schemaValidationErrorName = 'SchemaValidationError' as const;
type SchemaValidationErrorType = (typeof schemaValidationErrorType)[number];
const schemaValidationErrorType = ['UnexpectedError', 'InvalidInput'] as const;

export function createSchemaValidationError<Type extends SchemaValidationError['type']>(
  type: Type,
  message: string,
  cause: SchemaValidationError['cause'],
): SchemaValidationError<Type> {
  return createAppError(
    { name: schemaValidationErrorName, type, message, cause },
    createSchemaValidationError,
  );
}

export function isSchemaValidationError(input: unknown): input is SchemaValidationError {
  return implementZodSchema<SchemaValidationError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(schemaValidationErrorName),
        type: z.enum(schemaValidationErrorType),
      }),
    )
    .safeParse(input).success;
}

export function validateWithZod<T extends z.ZodTypeAny>(
  schema: T,
  errorMessage: string,
): (input: unknown) => e.Either<SchemaValidationError, z.output<T>>;
export function validateWithZod<T extends z.ZodTypeAny>(
  schema: T,
  errorMessage: string,
  input: unknown,
): e.Either<SchemaValidationError, z.output<T>>;
export function validateWithZod<T extends z.ZodTypeAny>(schema: T, errorMessage: string, input?: unknown) {
  function toValidationError(error: unknown): ValidationError | Error {
    if (error instanceof z.ZodError) return fromZodError(error);
    else if (error instanceof Error) return error;
    else return new Error('Unknown error happend when try to parse with zod', { cause: error });
  }

  const validationPipeline = (input: unknown): e.Either<SchemaValidationError, z.output<T>> =>
    pipe(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      e.tryCatch(() => schema.parse(input), toValidationError),
      e.mapLeft((error) => {
        return isValidationErrorLike(error)
          ? createSchemaValidationError('InvalidInput', errorMessage, error)
          : createSchemaValidationError(
              'UnexpectedError',
              'Unexpected error happened when try to parse the given input with zod schema',
              error,
            );
      }),
    );

  return isNotNil(input) ? validationPipeline(input) : validationPipeline;
}

export const schemaForType = <T>() => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    with: <S extends z.ZodType<T, any, any>>(arg: S) => {
      return arg;
    },
  };
};
