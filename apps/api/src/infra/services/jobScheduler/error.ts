import { z } from 'zod';

import { AppError, appErrorSchema, createAppError } from '#shared/errors/appError.js';
import { implementZodSchema } from '#shared/errors/utils.js';

export type JobSchedulerError<Type extends JobSchedulerErrorType = JobSchedulerErrorType> = AppError<
  JobSchedulerErrorName,
  Type
>;
type JobSchedulerErrorName = typeof jobSchedulerErrorName;
export const jobSchedulerErrorName = 'JobSchedulerError';
type JobSchedulerErrorType = (typeof jobSchedulerErrorType)[number];
export const jobSchedulerErrorType = [
  'CreateServiceFailed',
  'StartServiceFailed',
  'StopServiceFailed',
  'DefineJobFailed',
  'ScheduleJobFailed',
  'ExceedJobMaxSchedulingLimit',
] as const;

export function createJobSchedulerError<Type extends JobSchedulerError['type']>(
  type: Type,
  message: string,
  cause?: JobSchedulerError['cause'],
): JobSchedulerError<Type> {
  return createAppError({ name: jobSchedulerErrorName, type, message, cause }, createJobSchedulerError);
}

export function isJobSchedulerError(input: unknown): input is JobSchedulerError {
  return implementZodSchema<JobSchedulerError>()
    .with(
      appErrorSchema.extend({ name: z.literal(jobSchedulerErrorName), type: z.enum(jobSchedulerErrorType) }),
    )
    .safeParse(input).success;
}
