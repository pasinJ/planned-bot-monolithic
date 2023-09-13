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
  'InitiateServerFailed',
  'AddPluginFailed',
  'AddRouteFailed',
  'AddHookFailed',
  'StartServerFailed',
  'CloseServerFailed',
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
  return createHttpServerError('AddPluginFailed', `Adding ${pluginName} plugin failed`).setFactoryContext(
    createAddPluginFailed,
  );
}
export function createAddHookFailed(hookName: string): HttpServerError<'AddHookFailed'> {
  return createHttpServerError('AddHookFailed', `Adding ${hookName} hook failed`).setFactoryContext(
    createAddHookFailed,
  );
}
export function createAddHttpRouteError(
  method: string | string[],
  url: string,
): HttpServerError<'AddRouteFailed'> {
  return createHttpServerError(
    'AddRouteFailed',
    `Adding ${method.toString()} ${url} route failed`,
  ).setFactoryContext(createAddHttpRouteError);
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
