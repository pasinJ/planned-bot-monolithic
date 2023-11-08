import { HttpError, createHttpError } from '#infra/httpClient.error';
import { createGeneralError } from '#shared/errors/generalError';

import { randomString } from './faker';

export function mockHttpError(): HttpError {
  return createHttpError('UnhandledError', randomString(), createGeneralError('error', 'Mock'));
}
