import { DeepReadonly } from 'ts-essentials';

import type { HttpError } from './client.error.js';

export const HTTP_ERRORS: DeepReadonly<
  Record<HttpError['type'], { type: HttpError['type']; message: string }>
> = {
  InvalidRequest: {
    type: 'InvalidRequest',
    message: 'Request was rejected because it is invalid.',
  },
  Unauthorized: {
    type: 'Unauthorized',
    message: 'Request was rejected because it lacks valid authentication credentials.',
  },
  Forbidded: {
    type: 'Forbidded',
    message: 'Request was rejected because the user has insufficient rights.',
  },
  NotFound: {
    type: 'NotFound',
    message: 'Request was rejected because server cannot find the requested resource.',
  },
  BussinessError: {
    type: 'BussinessError',
    message: 'Request was rejected because it causes business logic error to happen.',
  },
  ClientSideError: {
    type: 'ClientSideError',
    message: 'Request was rejected because some of the client-side issue.',
  },
  InternalServerError: {
    type: 'InternalServerError',
    message: 'Request was rejected because some of the internal server error.',
  },
  ServerSideError: {
    type: 'ServerSideError',
    message: 'Request was rejected because some of the server-side error.',
  },
  NoResponse: {
    type: 'NoResponse',
    message: 'The request was made but no response was received.',
  },
  SendingFailed: {
    type: 'SendingFailed',
    message: 'Something happened when setting up the request on the client side that triggered an Error.',
  },
  InvalidResponse: { type: 'InvalidResponse', message: 'Receive invalid response from server.' },
  UnhandledError: {
    type: 'UnhandledError',
    message: 'Request was rejected because some of the unhandled error.',
  },
};
