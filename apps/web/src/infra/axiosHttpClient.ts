import axios, { AxiosError, AxiosInstance, CreateAxiosDefaults } from 'axios';
import * as ioe from 'fp-ts/lib/IOEither';
import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { __, allPass, equals, gte, lt, prop } from 'ramda';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { createExternalError } from '#shared/errors/externalError';
import { parseWithZod } from '#shared/utils/zod';

import { HTTP_ERRORS } from './httpClient.constant';
import { HttpError, createHttpError } from './httpClient.error';
import { HttpClient } from './httpClient.type';

export function createAxiosHttpClient(config?: CreateAxiosDefaults): HttpClient {
  const axiosInstance = axios.create(config);
  return { sendRequest: sendRequest(axiosInstance) };
}

function sendRequest(axiosInstance: AxiosInstance): HttpClient['sendRequest'] {
  return (options) => {
    const { responseSchema, body, ...rest } = options;
    return pipe(
      te.tryCatch(
        () => axiosInstance.request({ ...rest, data: body }),
        (error) => handleFailedRequest(error as AxiosError),
      ),
      te.map(prop('data')),
      te.chainIOEitherKW(validResponseBody(responseSchema)),
    );
  };
}

function validResponseBody<ResponseSchema extends z.ZodTypeAny>(responseSchema: ResponseSchema) {
  const { type, message } = HTTP_ERRORS.InvalidResponse;
  return (body: unknown): ioe.IOEither<HttpError, z.output<ResponseSchema>> =>
    pipe(
      parseWithZod(responseSchema, 'The received response body is invalid', body),
      ioe.fromEither,
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
