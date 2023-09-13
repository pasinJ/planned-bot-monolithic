import io from 'fp-ts/lib/IO.js';
import { z } from 'zod';

import { nonEmptyString } from '#shared/utils/zod.schema.js';

export type AppConfig = {
  ENV: Env;
  NAME: AppName;
  VERSION: AppVersion;
  GRACEFUL_PERIOD_MS: GracefulPeriodMs;
  LOG_LEVEL: LogLevel;
  LOG_FILE_ENABLE: boolean;
  LOG_FILE_PATH: LogFilePath;
};

export type Env = z.infer<typeof envSchema>;
const envSchema = nonEmptyString.toLowerCase().catch('development').brand('Env');

export type AppName = z.infer<typeof appNameSchema>;
const appNameSchema = nonEmptyString.catch('undefined name').brand('AppName');

export type AppVersion = z.infer<typeof appVersionSchema>;
const appVersionSchema = nonEmptyString.catch('undefined version').brand('AppVersion');

export type GracefulPeriodMs = z.infer<typeof gracefulPeriodMsSchema>;
const gracefulPeriodMsSchema = nonEmptyString
  .pipe(z.coerce.number().int().nonnegative())
  .catch(10000)
  .brand('GracefulPeriodMs');

export type LogLevel = z.infer<typeof logLevelSchema>;
const logLevelSchema = nonEmptyString
  .toLowerCase()
  .pipe(z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']))
  .catch('info')
  .brand('LogLevel');

const logFileEnablSchema = nonEmptyString
  .toLowerCase()
  .pipe(z.enum(['true', 'false']))
  .pipe(z.coerce.boolean())
  .catch(false);

export type LogFilePath = z.infer<typeof logFilePathSchema>;
const logFilePathSchema = nonEmptyString.brand('LogFilePath').or(z.undefined()).catch(undefined);

export const getAppConfig: io.IO<AppConfig> = () => {
  return {
    ENV: envSchema.parse(process.env.NODE_ENV),
    NAME: appNameSchema.parse(process.env.APP_NAME),
    VERSION: appVersionSchema.parse(process.env.APP_VERSION),
    GRACEFUL_PERIOD_MS: gracefulPeriodMsSchema.parse(process.env.APP_GRACEFUL_PERIOD_MS),
    LOG_LEVEL: logLevelSchema.parse(process.env.LOG_LEVEL),
    LOG_FILE_ENABLE: logFileEnablSchema.parse(process.env.LOG_FILE_ENABLE),
    LOG_FILE_PATH: logFilePathSchema.parse(process.env.LOG_FILE_PATH),
  };
};
