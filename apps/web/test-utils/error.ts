import { HttpError, createHttpError } from '#infra/httpClient.error';
import { createExternalError } from '#shared/errors/externalError';

import { randomString } from './faker';

export function mockHttpError(): HttpError {
  return createHttpError('UnhandledError', randomString(), createExternalError({ cause: randomString() }));
}
