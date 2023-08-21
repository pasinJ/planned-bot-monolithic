import io from 'fp-ts/lib/IO.js';
import {
  LoggerOptions,
  Logger as PinoLogger,
  StreamEntry,
  destination,
  levels,
  multistream,
  pino,
} from 'pino';
import pretty, { PrettyOptions } from 'pino-pretty';
import { mergeDeepWith } from 'ramda';

import { AppConfig, LogFilePath, getAppConfig } from '#config/app.js';
import { mergeConcatArray } from '#utils/general.js';

export type LoggerIO = {
  trace: <T extends object>(objOrMsg?: T | string, msg?: string) => io.IO<void>;
  debug: <T extends object>(objOrMsg?: T | string, msg?: string) => io.IO<void>;
  info: <T extends object>(objOrMsg?: T | string, msg?: string) => io.IO<void>;
  warn: <T extends object>(objOrMsg?: T | string, msg?: string) => io.IO<void>;
  error: <T extends object>(objOrMsg?: T | string, msg?: string) => io.IO<void>;
  fatal: <T extends object>(objOrMsg?: T | string, msg?: string) => io.IO<void>;
};

const mixinHook: LoggerOptions['mixin'] = (_, level) => ({ levelLabel: levels.labels[level] });
const mixinStrategy: LoggerOptions['mixinMergeStrategy'] = mergeDeepWith(mergeConcatArray);

const baseLogOptions: LoggerOptions = {
  messageKey: 'message',
  errorKey: 'error',
  nestedKey: 'details',
  mixin: mixinHook,
  mixinMergeStrategy: mixinStrategy,
};

const redactConf: LoggerOptions['redact'] = {
  paths: ['details.request.headers.cookies', 'details.request.body.password'],
  censor: '** REDACTED **',
};

function createTestLogger(): PinoLogger {
  return pino({ enabled: false });
}

function createDevLogger(
  loggerName: string,
  logConfig: Pick<AppConfig, 'LOG_LEVEL' | 'LOG_FILE_ENABLE' | 'LOG_FILE_PATH'>,
): PinoLogger {
  const { LOG_LEVEL, LOG_FILE_ENABLE, LOG_FILE_PATH } = logConfig;
  const options = { ...baseLogOptions, name: loggerName, level: LOG_LEVEL };
  const streams = createOutputStreams(LOG_FILE_ENABLE, LOG_FILE_PATH);

  return pino(options, streams);
}

function createProdLogger(
  loggerName: string,
  logConfig: Pick<AppConfig, 'LOG_LEVEL' | 'LOG_FILE_ENABLE' | 'LOG_FILE_PATH'>,
): PinoLogger {
  const { LOG_LEVEL, LOG_FILE_ENABLE, LOG_FILE_PATH } = logConfig;
  const options = { ...baseLogOptions, name: loggerName, level: LOG_LEVEL, redact: redactConf };
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

export function createPinoLogger(loggerName: string): PinoLogger {
  const appConfig = getAppConfig();
  return appConfig.ENV === 'test'
    ? createTestLogger()
    : appConfig.ENV === 'production'
    ? createProdLogger(loggerName, appConfig)
    : createDevLogger(loggerName, appConfig);
}

export function createLoggerIO(loggerName: string): LoggerIO {
  return wrapLogger(createPinoLogger(loggerName));
}

export function wrapLogger(loggerInstance: PinoLogger): LoggerIO {
  return {
    trace: (objOrMsg, msg) => () => loggerInstance.trace(objOrMsg, msg),
    debug: (objOrMsg, msg) => () => loggerInstance.debug(objOrMsg, msg),
    info: (objOrMsg, msg) => () => loggerInstance.info(objOrMsg, msg),
    warn: (objOrMsg, msg) => () => loggerInstance.warn(objOrMsg, msg),
    error: (objOrMsg, msg) => () => loggerInstance.error(objOrMsg, msg),
    fatal: (objOrMsg, msg) => () => loggerInstance.fatal(objOrMsg, msg),
  };
}
