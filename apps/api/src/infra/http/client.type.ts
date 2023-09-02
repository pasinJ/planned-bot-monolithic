import { AxiosError } from 'axios';
import te from 'fp-ts/lib/TaskEither.js';
import { ZodTypeDef, z } from 'zod';

import { CustomError } from '#shared/error.js';
import { SchemaValidationError } from '#shared/utils/zod.js';

export type HttpClient = { sendRequest: SendRequest };

export class HttpError extends CustomError<HttpErrorName, SchemaValidationError | AxiosError>(
  'UNHANDLED_ERROR',
  'Error happened when try to send HTTP request to external system',
) {}
export type HttpErrorName =
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDED'
  | 'NOT_FOUND'
  | 'BUSINESS_ERROR'
  | 'CLIENT_SIDE_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVER_SIDE_ERROR'
  | 'SENDING_FAILED'
  | 'NO_RESPONSE'
  | 'INVALID_RESPONSE'
  | 'UNHANDLED_ERROR';

type SendRequest = <
  T extends z.ZodType<Output, Def, Input>,
  Output,
  Def extends ZodTypeDef = ZodTypeDef,
  Input = Output,
  D = unknown,
>(options: {
  method: Method;
  url: string;
  headers?: Headers;
  params?: Params;
  body?: D;
  responseSchema: T;
}) => te.TaskEither<HttpError, z.output<T>>;

export type Method =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'PURGE'
  | 'LINK'
  | 'UNLINK';

type Headers = {
  [x: string]: HeaderValue | undefined;
  Accept?: HeaderValue | undefined;
  'Content-Encoding'?: HeaderValue | undefined;
  'Content-Type'?: HeaderValue | undefined;
};
type HeaderValue = string | string[] | number | boolean | null;

type Params = Record<string, string | number>;

export const HTTP_ERRORS: Record<HttpErrorName, { name: HttpErrorName; message: string }> = {
  INVALID_REQUEST: {
    name: 'INVALID_REQUEST',
    message: 'Request was rejected because it is invalid.',
  },
  UNAUTHORIZED: {
    name: 'UNAUTHORIZED',
    message: 'Request was rejected because it lacks valid authentication credentials.',
  },
  FORBIDDED: {
    name: 'FORBIDDED',
    message: 'Request was rejected because the user has insufficient rights.',
  },
  NOT_FOUND: {
    name: 'NOT_FOUND',
    message: 'Request was rejected because server cannot find the requested resource.',
  },
  BUSINESS_ERROR: {
    name: 'BUSINESS_ERROR',
    message: 'Request was rejected because it causes business logic error to happen.',
  },
  CLIENT_SIDE_ERROR: {
    name: 'CLIENT_SIDE_ERROR',
    message: 'Request was rejected because some of the client-side issue.',
  },
  INTERNAL_SERVER_ERROR: {
    name: 'INTERNAL_SERVER_ERROR',
    message: 'Request was rejected because some of the internal server error.',
  },
  SERVER_SIDE_ERROR: {
    name: 'SERVER_SIDE_ERROR',
    message: 'Request was rejected because some of the server-side error.',
  },
  NO_RESPONSE: {
    name: 'NO_RESPONSE',
    message: 'The request was made but no response was received.',
  },
  SENDING_FAILED: {
    name: 'SENDING_FAILED',
    message: 'Something happened when setting up the request on the client side that triggered an Error.',
  },
  INVALID_RESPONSE: { name: 'INVALID_RESPONSE', message: 'Receive invalid response from server.' },
  UNHANDLED_ERROR: {
    name: 'UNHANDLED_ERROR',
    message: 'Request was rejected because some of the unhandled error.',
  },
};
