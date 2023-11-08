import * as e from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { isNotNil, mapObjIndexed } from 'ramda';
import { ZodDiscriminatedUnionOption, ZodRawShape, z } from 'zod';
import { ValidationError, fromZodError, isValidationErrorLike } from 'zod-validation-error';

import { StringDatetimeToDateSchema, stringDatetimeToDate } from '#shared/common.type';
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

export function schemaForType<T>() {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    with: <S extends z.ZodType<T, any, any>>(arg: S) => {
      return arg;
    },
  };
}

type ReplaceDateSchemaWithStringToDate<T extends z.ZodTypeAny> = T extends z.ZodDate
  ? z.ZodPipeline<StringDatetimeToDateSchema, T>
  : T extends z.ZodArray<infer E>
  ? z.ZodPipeline<z.ZodArray<ReplaceDateSchemaWithStringToDate<E>>, T>
  : T extends z.ZodObject<infer A>
  ? ReplaceObjWithDateSchemaWithStringToDate<A>
  : T;
type ReplaceObjWithDateSchemaWithStringToDate<A extends ZodRawShape> = z.ZodObject<{
  [K in keyof A]: ReplaceDateSchemaWithStringToDate<A[K]>;
}>;
export function replaceDateSchemaWithStringToDate<T extends z.ZodTypeAny>(
  schema: T,
): ReplaceDateSchemaWithStringToDate<T> {
  function replaceDateSchema<T extends z.ZodTypeAny>(schema: T): ReplaceDateSchemaWithStringToDate<T> {
    /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
    return schema._def.typeName === 'ZodDate'
      ? stringDatetimeToDate.pipe(schema)
      : schema._def.typeName === 'ZodBranded'
      ? replaceDateSchema(schema._def.type).pipe(schema)
      : schema._def.typeName === 'ZodReadonly'
      ? replaceDateSchemaInObject(schema._def.innerType)
      : schema._def.typeName === 'ZodPipeline'
      ? replaceDateSchema(schema._def.in).pipe(schema)
      : schema._def.typeName === 'ZodArray'
      ? replaceDateSchema(schema._def.type).array().pipe(schema)
      : schema._def.typeName === 'ZodObject'
      ? replaceDateSchemaInObject(schema as unknown as z.ZodObject<ZodRawShape>)
      : schema._def.typeName === 'ZodDiscriminatedUnion'
      ? replaceDateSchemaInDiscriminatedUnion(
          schema as unknown as z.ZodDiscriminatedUnion<string, ZodDiscriminatedUnionOption<string>[]>,
        )
      : schema._def.typeName === 'ZodEffects'
      ? replaceDateSchema(schema._def.schema).pipe(schema)
      : schema;
    /* eslint-enable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
  }
  function replaceDateSchemaInObject<A extends ZodRawShape, T extends z.ZodObject<A>>(
    schema: T,
  ): ReplaceObjWithDateSchemaWithStringToDate<A> {
    const newObjSchema = mapObjIndexed((fieldSchema) => replaceDateSchema(fieldSchema), schema._def.shape());
    return schema.extend(newObjSchema) as ReplaceObjWithDateSchemaWithStringToDate<A>;
  }
  function replaceDateSchemaInDiscriminatedUnion<
    N extends string,
    O extends z.ZodDiscriminatedUnionOption<N>[],
    T extends z.ZodDiscriminatedUnion<N, O>,
  >(schema: T) {
    return z.discriminatedUnion(
      schema._def.discriminator,
      schema._def.options.map((unionSchema) => replaceDateSchemaInObject(unionSchema)) as unknown as [
        ZodDiscriminatedUnionOption<N>,
        ...ZodDiscriminatedUnionOption<N>[],
      ],
    );
  }

  return replaceDateSchema(schema);
}
