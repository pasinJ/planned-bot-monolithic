import e from 'fp-ts/lib/Either.js';
import { Json, stringify } from 'fp-ts/lib/Json.js';
import { pipe } from 'fp-ts/lib/function.js';
import { append, isNotNil, pickBy } from 'ramda';
import { z } from 'zod';

import { isError, isString } from '#shared/utils/typeGuards.js';

import { defineCauseSchema, implementZodSchema } from './utils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
type FactoryContext = ((...args: any[]) => any) | Function;

export type Error = { message: string; cause?: unknown; stack?: string };
export type GeneralCause = Error | string | undefined;
export type AppError<
  Name extends string = 'AppError',
  Type extends string | undefined = string | undefined,
  Cause extends GeneralCause = GeneralCause,
> = Error & {
  name: Name;
  message: string;
  stack?: string;
  get causesList(): string[];
  setCause: (cause: Cause) => AppError<Name, Type, Cause>;
  setFactoryContext: (factoryContext: FactoryContext) => AppError<Name, Type, Cause>;
  toString: () => string;
  toJSON: () => Json;
} & (undefined extends Type ? { type?: Type } : { type: Type }) &
  (undefined extends Cause ? { cause?: Cause } : { cause: Cause });

export const appErrorSchema = implementZodSchema<AppError>().with(
  z.object({
    name: z.string(),
    message: z.string(),
    type: z.string().optional(),
    cause: defineCauseSchema([isError, isString]).optional(),
    stack: z.string().optional(),
    causesList: z.string().array(),
    setCause: z.function(),
    setFactoryContext: z.function(),
    toString: z.function() as (() => string) & z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>,
    toJSON: z.function(),
  }),
);

export function createAppError<
  Name extends string = 'AppError',
  Type extends string | undefined = string | undefined,
  Cause extends GeneralCause = GeneralCause,
>(
  {
    name = 'AppError' as Name,
    message = '',
    type,
    cause = undefined as Cause,
  }: { name: Name; type?: Type; message?: string; cause: Cause },
  factoryContext: FactoryContext = createAppError,
): AppError<Name, Type, Cause> {
  const baseError = new Error(message);
  const appError = Object.assign(
    baseError,
    pickBy(isNotNil, {
      name,
      message,
      type,
      cause,
      get causesList(): string[] {
        return getCausesListLoopFromAppError(this.cause, []);
      },
      setCause(cause: Cause) {
        this.cause = cause;
        return this;
      },
      setFactoryContext(factoryContext: FactoryContext) {
        // Omit all frames above factoryFunction, including factoryFunction, from the generated stack trace.
        Error.captureStackTrace(this, factoryContext);
        return this;
      },
      toString() {
        return `[${this.name}${this.type ? `:${this.type}` : ''}]: ${this.message}`;
      },
      toJSON() {
        return pickBy(isNotNil, {
          name: this.name,
          message: this.message,
          type: this.type,
          causes: this.causesList,
        });
      },
    }),
  ) as AppError<Name, Type, Cause>;

  return appError.setFactoryContext(factoryContext);
}

function getCausesListLoopFromError({ cause }: Error, causeList: string[]): string[] {
  if (isError(cause)) return getCausesListLoopFromError(cause, append(cause.toString(), causeList));
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
function getCausesListLoopFromAppError<Cause extends GeneralCause>(
  cause: Cause,
  causeList: string[],
): string[] {
  if (isString(cause)) return append(cause, causeList);
  else if (isAppError(cause))
    return getCausesListLoopFromAppError(cause.cause, append(cause.toString(), causeList));
  else if (isError(cause)) return getCausesListLoopFromError(cause, append(cause.toString(), causeList));
  else return causeList;
}

export function isAppError(input: unknown): input is AppError {
  return appErrorSchema.safeParse(input).success;
}
