import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { implementZodSchema } from '#shared/errors/utils.js';

export type StrategyExecutorError<Type extends string = string> = AppError<StrategyExecutorErrorName, Type>;

type StrategyExecutorErrorName = typeof strategyExecutorErrorName;
const strategyExecutorErrorName = 'StrategyExecutorError' as const;

export function createStrategyExecutorError<Type extends StrategyExecutorError['type']>(
  type: Type,
  message: string,
  cause?: StrategyExecutorError['cause'],
): StrategyExecutorError<Type> {
  return createAppError(
    { name: strategyExecutorErrorName, type, message, cause },
    createStrategyExecutorError,
  );
}

export function isStrategyExecutorError(input: unknown): input is StrategyExecutorError {
  return implementZodSchema<StrategyExecutorError>()
    .with(appErrorSchema.extend({ name: z.literal(strategyExecutorErrorName), type: z.string() }))
    .safeParse(input).success;
}
