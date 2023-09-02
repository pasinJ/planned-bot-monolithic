import type { HttpErrorName } from './httpClient.type';

export const API_BASE_URL = process.env.VITE_API_BASE_URL ?? 'http://localhost';

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
