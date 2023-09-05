import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { ExternalError, isExternalError } from '#shared/errors/externalError.js';
import { defineCauseSchema, implementZodSchema } from '#shared/errors/utils.js';

export type HttpServerError<Type extends HttpServerErrorType = HttpServerErrorType> = AppError<
  HttpServerErrorName,
  Type,
  ExternalError | undefined
>;

type HttpServerErrorName = typeof httpServerErrorName;
const httpServerErrorName = 'HttpServerError' as const;
type HttpServerErrorType = (typeof httpServerErrorType)[number];
const httpServerErrorType = [
  'InitiateServerError',
  'AddPluginError',
  'AddRouteError',
  'AddHookError',
  'StartServerError',
  'CloseServerError',
  'UnhandledError',
] as const;

export function createHttpServerError<Type extends HttpServerError['type']>(
  type: Type,
  message: string,
  cause?: HttpServerError['cause'],
): HttpServerError<Type> {
  return createAppError({ name: httpServerErrorName, type, message, cause }, createHttpServerError);
}
export function createAddPluginError(pluginName: string): HttpServerError<'AddPluginError'> {
  return createHttpServerError('AddPluginError', `Adding ${pluginName} plugin failed`).setFactoryContext(
    createAddPluginError,
  );
}
export function createAddHookError(hookName: string): HttpServerError<'AddHookError'> {
  return createHttpServerError('AddHookError', `Adding ${hookName} hook failed`).setFactoryContext(
    createAddHookError,
  );
}
export function createAddHttpRouteError(method: string, url: string): HttpServerError<'AddRouteError'> {
  return createHttpServerError('AddRouteError', `Adding ${method} ${url} route failed`).setFactoryContext(
    createAddHttpRouteError,
  );
}

export function isHttpServerError(input: unknown): input is HttpServerError {
  return implementZodSchema<HttpServerError>()
    .with(
      appErrorSchema.extend({
        name: z.literal(httpServerErrorName),
        type: z.enum(httpServerErrorType),
        cause: defineCauseSchema([isExternalError]).optional(),
      }),
    )
    .safeParse(input).success;
}
