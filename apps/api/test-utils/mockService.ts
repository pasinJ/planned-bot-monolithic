import { faker } from '@faker-js/faker';
import { constVoid } from 'fp-ts/lib/function.js';

import { LoggerIo } from '#infra/logging.js';
import { DateService } from '#infra/services/dateService.type.js';
import { IdService } from '#infra/services/idService.type.js';

export function mockDateService(): DateService {
  return { getCurrentDate: () => faker.date.recent() };
}

export function mockIdService(): IdService {
  return { generateSymbolId: () => faker.string.nanoid() } as IdService;
}

export function mockLoggerIo(): LoggerIo {
  return {
    trace: constVoid,
    debug: constVoid,
    info: constVoid,
    warn: constVoid,
    error: constVoid,
    fatal: constVoid,
    traceIo: () => constVoid,
    debugIo: () => constVoid,
    infoIo: () => constVoid,
    warnIo: () => constVoid,
    errorIo: () => constVoid,
    fatalIo: () => constVoid,
  };
}
