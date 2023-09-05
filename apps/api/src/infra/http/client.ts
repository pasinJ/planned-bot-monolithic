import axios, { AxiosError, AxiosInstance, AxiosResponse, CreateAxiosDefaults } from 'axios';
import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { __, allPass, equals, gte, lt } from 'ramda';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { LoggerIo } from '#infra/logging.js';
import { createExternalError } from '#shared/errors/externalError.js';
import { parseWithZod } from '#shared/utils/zod.js';

import { HTTP_ERRORS } from './client.constant.js';
import { HttpError, createHttpError } from './client.error.js';
import { HttpClient } from './client.type.js';

export function createAxiosHttpClient(logger: LoggerIo, config?: CreateAxiosDefaults): HttpClient {
  const axiosInstance = axios.create(config);
  return { sendRequest: sendRequest(axiosInstance, logger) };
}

function sendRequest(axiosInstance: AxiosInstance, logger: LoggerIo): HttpClient['sendRequest'] {
  return (options) => {
    const { responseSchema, body, ...rest } = options;
    return pipe(
      te.fromIO(logger.debugIo(`Sending request with options: %j`, { ...rest, body })),
      te.chain(() =>
        te.tryCatch(
          () => axiosInstance.request({ ...rest, data: body }),
          (error) => handleFailedRequest(error as AxiosError),
        ),
      ),
      te.chainIOK(getResponseBody(logger)),
      te.chainIOEitherKW(validResponseBody(responseSchema, logger)),
    );
  };
}

function getResponseBody(logger: LoggerIo) {
  return (response: AxiosResponse): io.IO<unknown> =>
    pipe(
      io.of(response.data),
      io.chainFirst((body) => logger.debugIo(`Receive response body: %j`, body)),
    );
}

function validResponseBody<ResponseSchema extends z.ZodTypeAny>(
  responseSchema: ResponseSchema,
  logger: LoggerIo,
) {
  const { type, message } = HTTP_ERRORS.InvalidResponse;
  return (body: unknown): ioe.IOEither<HttpError, z.output<ResponseSchema>> =>
    pipe(
      parseWithZod(responseSchema, 'The received response body is invalid', body),
      ioe.fromEither,
      ioe.orElseFirstIOK((error) =>
        logger.errorIo({ error }, 'Error happened when validing HTTP response body'),
      ),
      ioe.mapLeft((error) => createHttpError(type, message, error)),
    );
}

function handleFailedRequest(axiosError: AxiosError): HttpError {
  const is4xx = allPass([gte(__, 400), lt(__, 500)]);
  const is5xx = allPass([gte(__, 500), lt(__, 600)]);

  const externalError = createExternalError({
    message: 'Axios error happen when sending request to external system',
    cause: axiosError,
  });

  if (axiosError.response) {
    const { type, message } = match(axiosError.response.status)
      .when(equals(400), () => HTTP_ERRORS.InvalidRequest)
      .when(equals(401), () => HTTP_ERRORS.Unauthorized)
      .when(equals(403), () => HTTP_ERRORS.Forbidded)
      .when(equals(404), () => HTTP_ERRORS.NotFound)
      .when(equals(409), () => HTTP_ERRORS.BussinessError)
      .when(is4xx, () => HTTP_ERRORS.ClientSideError)
      .when(equals(500), () => HTTP_ERRORS.InternalServerError)
      .when(is5xx, () => HTTP_ERRORS.ServerSideError)
      .otherwise(() => HTTP_ERRORS.UnhandledError);

    return createHttpError(type, message, externalError);
  } else if (axiosError.request) {
    const { type, message } = HTTP_ERRORS.NoResponse;
    return createHttpError(type, message, externalError);
  } else {
    const { type, message } = HTTP_ERRORS.SendingFailed;
    return createHttpError(type, message, externalError);
  }
}
