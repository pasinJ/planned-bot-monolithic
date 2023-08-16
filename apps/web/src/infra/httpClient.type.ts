import * as te from 'fp-ts/lib/TaskEither';
import { z } from 'zod';

import { ErrorBase } from '#utils/error';

export type HttpClient = { sendRequest: SendRequest };

export class HttpError extends ErrorBase<HttpErrorName> {}
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
  B extends string,
  Output,
  Def extends z.ZodTypeDef = z.ZodTypeDef,
  Input = Output,
  D = unknown,
>(options: {
  method: Method;
  url: string;
  headers?: Headers;
  params?: Params;
  body?: D;
  responseSchema: z.ZodType<Output, Def, Input> | z.ZodBranded<z.ZodString, B>;
}) => te.TaskEither<
  HttpError,
  typeof options.responseSchema extends z.ZodType ? Output : string & z.BRAND<B>
>;

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
