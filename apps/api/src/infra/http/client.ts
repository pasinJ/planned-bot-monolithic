import axios, { AxiosError, AxiosInstance, CreateAxiosDefaults } from 'axios';
import io from 'fp-ts/lib/IO.js';
import te from 'fp-ts/lib/TaskEither.js';
import { flow, pipe } from 'fp-ts/lib/function.js';
import { __, allPass, equals, gte, lt, prop } from 'ramda';
import { match } from 'ts-pattern';

import { LoggerIo } from '#infra/logging.js';
import { SchemaValidationError, parseWithZod } from '#shared/utils/zod.js';

import { HTTP_ERRORS, HttpClient, HttpError } from './client.type.js';

const { INVALID_RESPONSE } = HTTP_ERRORS;

export function createAxiosHttpClient(logger: LoggerIo, config?: CreateAxiosDefaults): HttpClient {
  const axiosInstance = axios.create(config);
  return { sendRequest: sendRequest(axiosInstance, logger) };
}

function sendRequest(axiosInstance: AxiosInstance, logger: LoggerIo): HttpClient['sendRequest'] {
  return (options) => {
    const { responseSchema, body, ...rest } = options;
    return pipe(
      te.fromIO(logger.debugIo(`Start sending request with options: %j`, { ...rest, data: body })),
      te.chain(() =>
        te.tryCatch(
          () => axiosInstance.request({ ...rest, data: body }),
          (error) => handleFailedRequest(error as AxiosError),
        ),
      ),
      te.chainIOK(
        flow(
          prop('data'),
          io.of,
          io.chainFirst((body) => logger.debugIo(`Receive response with body: %j`, body)),
        ),
      ),
      te.chainEitherKW(parseWithZod(responseSchema, 'An Error occurs when try to validate HTTP response')),
      te.mapLeft((error) =>
        error instanceof SchemaValidationError
          ? new HttpError(INVALID_RESPONSE.name, INVALID_RESPONSE.message).causedBy(error)
          : error,
      ),
    );
  };
}

function handleFailedRequest(error: AxiosError): HttpError {
  const is4xx = allPass([gte(__, 400), lt(__, 500)]);
  const is5xx = allPass([gte(__, 500), lt(__, 600)]);

  if (error.response) {
    const { name, message } = match(error.response.status)
      .when(equals(400), () => HTTP_ERRORS.INVALID_REQUEST)
      .when(equals(401), () => HTTP_ERRORS.UNAUTHORIZED)
      .when(equals(403), () => HTTP_ERRORS.FORBIDDED)
      .when(equals(404), () => HTTP_ERRORS.NOT_FOUND)
      .when(equals(409), () => HTTP_ERRORS.BUSINESS_ERROR)
      .when(is4xx, () => HTTP_ERRORS.CLIENT_SIDE_ERROR)
      .when(equals(500), () => HTTP_ERRORS.INTERNAL_SERVER_ERROR)
      .when(is5xx, () => HTTP_ERRORS.SERVER_SIDE_ERROR)
      .otherwise(() => HTTP_ERRORS.UNHANDLED_ERROR);

    return new HttpError(name, message);
  } else if (error.request)
    return new HttpError(HTTP_ERRORS.NO_RESPONSE.name, HTTP_ERRORS.NO_RESPONSE.message);
  else return new HttpError(HTTP_ERRORS.SENDING_FAILED.name, HTTP_ERRORS.SENDING_FAILED.message);
}
