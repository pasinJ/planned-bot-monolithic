import { constVoid } from 'fp-ts/lib/function.js';
import { pino } from 'pino';

import { LoggerIo, PinoLogger } from '#infra/logging.js';

export function mockMainLogger(): PinoLogger {
  return pino({ enabled: false });
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
