import te from 'fp-ts/lib/TaskEither.js';
import { rm } from 'fs/promises';

import { FileServiceError, createFileServiceError } from '#infra/services/file/error.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

export function removeDirectory(dirPath: string): te.TaskEither<FileServiceError<'RemoveDirFailed'>, void> {
  return te.tryCatch(
    () => rm(dirPath, { recursive: true }),
    createErrorFromUnknown(
      createFileServiceError('RemoveDirFailed', `Removing directory at ${dirPath} failed`),
    ),
  );
}
