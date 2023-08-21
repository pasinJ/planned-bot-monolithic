import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { z } from 'zod';
import { ValidationError, isValidationError, toValidationError } from 'zod-validation-error';

import { ErrorBase } from '#shared/error.js';

export class SchemaValidationError extends ErrorBase<
  'MISMATCH_SCHEMA' | 'SCHEMA_VALIDATION_FAILED',
  ValidationError | Error
> {}

export function parseWithZod<
  B extends string,
  Output,
  Def extends z.ZodTypeDef = z.ZodTypeDef,
  Input = Output,
>(
  schema: z.ZodType<Output, Def, Input> | z.ZodBranded<z.ZodString, B>,
  message: string,
): (
  value: unknown,
) => e.Either<SchemaValidationError, typeof schema extends z.ZodType ? Output : string & z.BRAND<B>>;
export function parseWithZod<
  B extends string,
  Output,
  Def extends z.ZodTypeDef = z.ZodTypeDef,
  Input = Output,
>(
  schema: z.ZodType<Output, Def, Input> | z.ZodBranded<z.ZodString, B>,
  message: string,
  value: unknown,
): e.Either<SchemaValidationError, typeof schema extends z.ZodType ? Output : string & z.BRAND<B>>;
export function parseWithZod<
  B extends string,
  Output,
  Def extends z.ZodTypeDef = z.ZodTypeDef,
  Input = Output,
>(schema: z.ZodType<Output, Def, Input> | z.ZodBranded<z.ZodString, B>, message: string, value?: unknown) {
  const internalFn = (
    value: unknown,
  ): e.Either<SchemaValidationError, typeof schema extends z.ZodType ? Output : string & z.BRAND<B>> =>
    pipe(
      e.tryCatch(
        () => schema.parse(value) as typeof schema extends z.ZodType ? Output : string & z.BRAND<B>,
        toValidationError(),
      ),
      e.mapLeft((error) =>
        isValidationError(error)
          ? new SchemaValidationError('MISMATCH_SCHEMA', message, error)
          : new SchemaValidationError('SCHEMA_VALIDATION_FAILED', 'Cannot validate the given schema', error),
      ),
    );

  if (value) return internalFn(value);
  else return internalFn;
}
