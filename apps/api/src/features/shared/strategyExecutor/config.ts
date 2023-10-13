import { z } from 'zod';

import { nonEmptyStringSchema } from '#shared/utils/string.js';

export type StrategyExecutorConfig = Readonly<{
  LIBS_DIR_PATH: LibsDirPath;
  EXECUTE_TIMEOUT_MS: ExecuteStrategyTimeout;
}>;

export type LibsDirPath = z.infer<typeof libsDirPathSchema>;
const libsDirPathSchema = nonEmptyStringSchema.catch('./src/libs').brand('LibsDirPath');

export type ExecuteStrategyTimeout = z.infer<typeof executeStrategyTimeoutSchema>;
const executeStrategyTimeoutSchema = nonEmptyStringSchema
  .pipe(z.coerce.number().int().positive())
  .catch(5000)
  .brand('ExecuteStrategyTimeout');

export function getStrategyExecutorConfig(): StrategyExecutorConfig {
  return {
    LIBS_DIR_PATH: libsDirPathSchema.parse(process.env.LIBS_DIR_PATH),
    EXECUTE_TIMEOUT_MS: executeStrategyTimeoutSchema.parse(process.env.EXECUTE_STRATEGY_TIMEOUT_MS),
  };
}
