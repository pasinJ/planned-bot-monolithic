import te from 'fp-ts/lib/TaskEither.js';
import { mkdir } from 'fs/promises';

import { FileServiceError, createFileServiceError } from '#infra/services/file/error.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

export type CreateDirectory = (dirPath: string) => te.TaskEither<CreateDirectoryError, void>;
export type CreateDirectoryError = FileServiceError<'CreateDirFailed'>;
export function createDirectory(...[dirPath]: Parameters<CreateDirectory>): ReturnType<CreateDirectory> {
  return te.tryCatch(
    () => mkdir(dirPath),
    createErrorFromUnknown(
      createFileServiceError('CreateDirFailed', `Creating directory at ${dirPath} failed`),
    ),
  );
}
