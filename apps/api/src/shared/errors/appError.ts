import e from 'fp-ts/lib/Either.js';
import { stringify } from 'fp-ts/lib/Json.js';
import { pipe } from 'fp-ts/lib/function.js';
import { append, assoc, isNotNil, pick, pickBy, propOr } from 'ramda';
import { z } from 'zod';

import { OmitNever } from '#shared/helpers.type.js';
import { isError, isString } from '#shared/utils/typeGuards.js';
import { Json } from '#shared/utils/zod.schema.js';

import { implementZodSchema } from './utils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
type FactoryContext = ((...args: any[]) => any) | Function;

export type GeneralCause = Error | string | undefined;
export type AppError<Name extends string = string, Type extends string | undefined = string | undefined> = {
  name: Name;
  message: string;
  cause?: AppError | GeneralCause;
  stack?: string;
  toString: () => string;
  toJSON: () => Json;
} & OmitNever<undefined extends Type ? { type?: Type } : { type: Type }>;

const baseAppErrorSchema = z.object({
  name: z.string(),
  message: z.string(),
  type: z.string().optional(),
  stack: z.string().optional(),
  toString: z.function() as (() => string) & z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>,
  toJSON: z.function(),
});
export const appErrorSchema = implementZodSchema<AppError>().with(
  baseAppErrorSchema.extend({
    cause: z.union([z.string(), z.instanceof(Error), z.lazy(() => baseAppErrorSchema)]).optional(),
  }),
);

export function createAppError<
  Name extends string = string,
  Type extends string | undefined = string | undefined,
>(
  data: { name?: Name; message?: string; type?: Type; cause?: AppError | GeneralCause },
  factoryContext: FactoryContext = createAppError,
): AppError<Name, Type> {
  const appError = {
    ...pickBy(isNotNil, { name: 'AppError', message: '', ...data }),
    toString() {
      return `[${this.name}${propOr<string, AppError, string>('', 'type', this)}]: ${this.message}`;
    },
    toJSON() {
      return { ...pick(['name', 'message', 'type'], this), causesList: getCausesList(this) };
    },
  } as AppError<Name, Type>;

  return setStack(appError, factoryContext);
}

export function isAppError(input: unknown): input is AppError {
  return appErrorSchema.safeParse(input).success;
}

export function setCause<E extends AppError>(error: E): (cause: AppError | GeneralCause) => E;
export function setCause<E extends AppError>(error: E, cause: AppError | GeneralCause): E;
export function setCause<E extends AppError>(
  error: E,
  cause?: AppError | GeneralCause,
): E | ((cause: AppError | GeneralCause) => E) {
  const setCauseFn = (cause: AppError | GeneralCause) => assoc('cause', cause, error) as E;

  return isNotNil(cause) ? setCauseFn(cause) : setCauseFn;
}

export function setStack<E extends AppError>(error: E, factoryContext?: FactoryContext): E {
  const cloneError = { ...error };
  Error.captureStackTrace(cloneError, factoryContext);

  return cloneError;
}

export function getCausesList<E extends AppError>(error: E): string[] {
  function getCausesListFromAppError<E extends AppError>({ cause }: E, causeList: string[]): string[] {
    if (isString(cause)) return append(cause, causeList);
    else if (isAppError(cause)) return getCausesListFromAppError(cause, append(cause.toString(), causeList));
    else if (isError(cause)) return getCausesListFromError(cause, append(cause.toString(), causeList));
    else return causeList;
  }
  function getCausesListFromError({ cause }: Error, causeList: string[]): string[] {
    if (isError(cause)) return getCausesListFromError(cause, append(cause.toString(), causeList));
    else if (isNotNil(cause))
      return pipe(
        stringify(cause),
        e.match(
          () => causeList,
          (causeString) => append(causeString, causeList),
        ),
      );
    else return causeList;
  }

  return getCausesListFromAppError(error, []);
}

export function createErrorFromUnknown<E extends AppError>(error: E) {
  return (cause: unknown): E => {
    return isString(cause) || isError(cause)
      ? pipe(setCause(error, cause), (error) => setStack(error, createErrorFromUnknown))
      : pipe(setCause(error, 'Unexpected cause (created from unknown)'), (error) =>
          setStack(error, createErrorFromUnknown),
        );
  };
}
