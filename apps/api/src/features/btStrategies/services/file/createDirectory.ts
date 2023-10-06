import te from 'fp-ts/lib/TaskEither.js';
import { mkdir } from 'fs/promises';

import { FileServiceError, createFileServiceError } from '#infra/services/file/error.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

export function createDirectory(dirPath: string): te.TaskEither<FileServiceError<'CreateDirFailed'>, void> {
  return te.tryCatch(
    () => mkdir(dirPath),
    createErrorFromUnknown(
      createFileServiceError('CreateDirFailed', `Creating directory at ${dirPath} failed`),
    ),
  );
}
