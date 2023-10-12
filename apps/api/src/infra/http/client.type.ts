import te from 'fp-ts/lib/TaskEither.js';
import { z } from 'zod';

import { GeneralError } from '#shared/errors/generalError.js';

import { HttpError } from './client.error.js';

export type HttpClient = { sendRequest: SendRequest; downloadFile: DownloadFile };

type SendRequest = <ResponseSchema extends z.ZodTypeAny, Data = unknown>(
  options: SendRequestOptions<ResponseSchema, Data>,
) => te.TaskEither<HttpError, z.output<ResponseSchema>>;
type SendRequestOptions<ResponseSchema extends z.ZodTypeAny, Data = unknown> = {
  method: HttpMethod;
  url: string;
  headers?: Headers;
  params?: Params;
  body?: Data;
  responseSchema: ResponseSchema;
};

type DownloadFile = <Data = unknown>(options: {
  method: HttpMethod;
  url: string;
  outputPath: string;
  headers?: Headers;
  params?: Params;
  body?: Data;
}) => te.TaskEither<HttpError | GeneralError<'WriteFileFailed'>, void>;

export type HttpMethod =
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
