import * as te from 'fp-ts/lib/TaskEither';
import { z } from 'zod';

import { HttpError } from './httpClient.error';

export type HttpClient = { sendRequest: SendRequest };

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
