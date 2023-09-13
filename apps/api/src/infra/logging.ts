import io from 'fp-ts/lib/IO.js';
import {
  LoggerOptions as PinoLoggerOptions,
  StreamEntry,
  destination,
  levels,
  multistream,
  pino,
} from 'pino';
import pretty, { PrettyOptions } from 'pino-pretty';
import { mergeDeepWith, pick, prop } from 'ramda';

import { AppConfig, LogFilePath, getAppConfig } from '#shared/app.config.js';
import { mergeConcatArray } from '#utils/general.js';

type LogFn = {
  <T extends object>(obj: T, msg?: string, ...args: unknown[]): void;
  (obj: unknown, msg?: string, ...args: unknown[]): void;
  (msg: string, ...args: unknown[]): void;
};
type LogFnIo = {
  <T extends object>(obj: T, msg?: string, ...args: unknown[]): io.IO<void>;
  (obj: unknown, msg?: string, ...args: unknown[]): io.IO<void>;
  (msg: string, ...args: unknown[]): io.IO<void>;
};

export type PinoLogger = pino.Logger;
export type LoggerIo = {
  trace: LogFn;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  fatal: LogFn;
  traceIo: LogFnIo;
  debugIo: LogFnIo;
  infoIo: LogFnIo;
  warnIo: LogFnIo;
  errorIo: LogFnIo;
  fatalIo: LogFnIo;
};

const mixinHook: PinoLoggerOptions['mixin'] = (_, level) => ({ levelLabel: prop(level, levels.labels) });
const mixinStrategy: PinoLoggerOptions['mixinMergeStrategy'] = mergeDeepWith(mergeConcatArray);

const baseLogOptions: PinoLoggerOptions = {
  messageKey: 'message',
  errorKey: 'error',
  nestedKey: 'details',
  mixin: mixinHook,
  mixinMergeStrategy: mixinStrategy,
};

const redactConf: PinoLoggerOptions['redact'] = {
  paths: ['details.request.headers.cookies', 'details.request.body.password'],
  censor: '** REDACTED **',
};

export function createMainLogger(): PinoLogger {
  const appConfig = getAppConfig();
  return appConfig.ENV === 'test'
    ? createTestLogger()
    : appConfig.ENV === 'production'
    ? createProdLogger(appConfig)
    : createDevLogger(appConfig);
}

export function createLogger(loggerName: string, mainLogger: PinoLogger): PinoLogger {
  return mainLogger.child({ name: loggerName });
}

export function createLoggerIo(loggerName: string, mainLogger: PinoLogger): LoggerIo {
  return wrapLogger(createLogger(loggerName, mainLogger));
}

export function wrapLogger(logger: PinoLogger): LoggerIo {
  return {
    ...pick(['trace', 'debug', 'info', 'warn', 'error', 'fatal'], logger),
    traceIo: ((...args: [msg: string, ...args: unknown[]]) =>
      () =>
        logger.trace(...args)) as LogFnIo,
    debugIo: ((...args: [msg: string, ...args: unknown[]]) =>
      () =>
        logger.debug(...args)) as LogFnIo,
    infoIo: ((...args: [msg: string, ...args: unknown[]]) =>
      () =>
        logger.info(...args)) as LogFnIo,
    warnIo: ((...args: [msg: string, ...args: unknown[]]) =>
      () =>
        logger.warn(...args)) as LogFnIo,
    errorIo: ((...args: [msg: string, ...args: unknown[]]) =>
      () =>
        logger.error(...args)) as LogFnIo,
    fatalIo: ((...args: [msg: string, ...args: unknown[]]) =>
      () =>
        logger.fatal(...args)) as LogFnIo,
  };
}

function createTestLogger(): PinoLogger {
  return pino({ enabled: false });
}

function createDevLogger(
  logConfig: Pick<AppConfig, 'LOG_LEVEL' | 'LOG_FILE_ENABLE' | 'LOG_FILE_PATH'>,
): PinoLogger {
  const { LOG_LEVEL, LOG_FILE_ENABLE, LOG_FILE_PATH } = logConfig;
  const options = { ...baseLogOptions, level: LOG_LEVEL };
  const streams = createOutputStreams(LOG_FILE_ENABLE, LOG_FILE_PATH);

  return pino(options, streams);
}

function createProdLogger(
  logConfig: Pick<AppConfig, 'LOG_LEVEL' | 'LOG_FILE_ENABLE' | 'LOG_FILE_PATH'>,
): PinoLogger {
  const { LOG_LEVEL, LOG_FILE_ENABLE, LOG_FILE_PATH } = logConfig;
  const options = { ...baseLogOptions, level: LOG_LEVEL, redact: redactConf };
  const streams = createOutputStreams(LOG_FILE_ENABLE, LOG_FILE_PATH);

  return pino(options, streams);
}

function createOutputStreams(enableLogFile: boolean, logFilePath: LogFilePath) {
  const basePrettyOptions: PrettyOptions = {
    translateTime: 'SYS:standard',
    messageKey: 'message',
    messageFormat: '{requestId} | {message}',
    ignore: 'pid,hostname',
    colorize: true,
    hideObject: true,
  };
  const stdStreams: StreamEntry[] = [
    { level: 'trace', stream: pretty.default({ destination: process.stdout, ...basePrettyOptions }) },
    { level: 'error', stream: pretty.default({ destination: process.stderr, ...basePrettyOptions }) },
  ];

  return enableLogFile && logFilePath
    ? multistream([
        { level: 'trace', stream: multistream(stdStreams, { dedupe: true }) },
        { level: 'trace', stream: destination({ dest: logFilePath, mkdir: true }) },
      ])
    : multistream(stdStreams, { dedupe: true });
}
