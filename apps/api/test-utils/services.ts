import { faker } from '@faker-js/faker';
import te from 'fp-ts/lib/TaskEither.js';
import { constVoid } from 'fp-ts/lib/function.js';

import { LoggerIo } from '#infra/logging.js';
import { BnbService } from '#infra/services/binance/service.type.js';
import { DateService } from '#infra/services/date.type.js';

export function mockDateService(overrides?: Partial<DateService>): DateService {
  return { getCurrentDate: () => faker.date.recent(), ...overrides };
}

export function mockBnbService(overrides?: Partial<BnbService>): BnbService {
  return {
    getSpotSymbols: te.of([]),
    ...overrides,
  };
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
