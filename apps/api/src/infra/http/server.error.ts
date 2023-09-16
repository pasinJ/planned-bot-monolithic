import { pipe } from 'fp-ts/lib/function.js';
import { z } from 'zod';

import { AppError, appErrorSchema, createAppError, setStack } from '#shared/errors/appError.js';
import { implementZodSchema } from '#shared/errors/utils.js';

export type HttpServerError<Type extends HttpServerErrorType = HttpServerErrorType> = AppError<
  HttpServerErrorName,
  Type
>;

type HttpServerErrorName = typeof httpServerErrorName;
const httpServerErrorName = 'HttpServerError' as const;
type HttpServerErrorType = (typeof httpServerErrorType)[number];
const httpServerErrorType = [
  'InitiateServerFailed',
  'AddPluginFailed',
  'AddRouteFailed',
  'AddHookFailed',
  'StartServerFailed',
  'StopServerFailed',
  'Unhandled',
] as const;

export function createHttpServerError<Type extends HttpServerError['type']>(
  type: Type,
  message: string,
  cause?: HttpServerError['cause'],
): HttpServerError<Type> {
  return createAppError({ name: httpServerErrorName, type, message, cause }, createHttpServerError);
}

export function createAddPluginFailed(pluginName: string): HttpServerError<'AddPluginFailed'> {
  return pipe(createHttpServerError('AddPluginFailed', `Adding ${pluginName} plugin failed`), (error) =>
    setStack(error, createAddPluginFailed),
  );
}

export function createAddHookFailed(hookName: string): HttpServerError<'AddHookFailed'> {
  return pipe(createHttpServerError('AddHookFailed', `Adding ${hookName} hook failed`), (error) =>
    setStack(error, createAddPluginFailed),
  );
}

export function createAddHttpRouteError(
  method: string | string[],
  url: string,
): HttpServerError<'AddRouteFailed'> {
  return pipe(
    createHttpServerError('AddRouteFailed', `Adding ${method.toString()} ${url} route failed`),
    (error) => setStack(error, createAddPluginFailed),
  );
}

export function isHttpServerError(input: unknown): input is HttpServerError {
  return implementZodSchema<HttpServerError>()
    .with(appErrorSchema.extend({ name: z.literal(httpServerErrorName), type: z.enum(httpServerErrorType) }))
    .safeParse(input).success;
}
