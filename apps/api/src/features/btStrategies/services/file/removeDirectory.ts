import te from 'fp-ts/lib/TaskEither.js';
import { rm } from 'fs/promises';

import { FileServiceError, createFileServiceError } from '#infra/services/file/error.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

export type RemoveDirectory = (dirPath: string) => te.TaskEither<RemoveDirectoryError, void>;
export type RemoveDirectoryError = FileServiceError<'RemoveDirFailed'>;
export function removeDirectory(...[dirPath]: Parameters<RemoveDirectory>): ReturnType<RemoveDirectory> {
  return te.tryCatch(
    () => rm(dirPath, { recursive: true }),
    createErrorFromUnknown(
      createFileServiceError('RemoveDirFailed', `Removing directory at ${dirPath} failed`),
    ),
  );
}
