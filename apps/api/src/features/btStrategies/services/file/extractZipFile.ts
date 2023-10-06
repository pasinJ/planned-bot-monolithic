import te from 'fp-ts/lib/TaskEither.js';
import { createReadStream, createWriteStream } from 'node:fs';
import unzipper from 'unzipper';

import { FileServiceError, createFileServiceError } from '#infra/services/file/error.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

export function extractZipFile(
  zipFilePath: string,
  outputFilePath: string,
): te.TaskEither<FileServiceError<'ExtractZipFileFailed'>, void> {
  return te.tryCatch(
    () =>
      new Promise((resolve, reject) =>
        createReadStream(zipFilePath)
          .on('error', (error) => reject(error))
          .pipe(unzipper.ParseOne())
          .on('error', (error) => reject(error))
          .pipe(createWriteStream(outputFilePath))
          .on('finish', () => resolve(undefined))
          .on('error', (error) => reject(error)),
      ),
    createErrorFromUnknown(
      createFileServiceError('ExtractZipFileFailed', `Extracting zip file from ${zipFilePath} failed`),
    ),
  );
}
