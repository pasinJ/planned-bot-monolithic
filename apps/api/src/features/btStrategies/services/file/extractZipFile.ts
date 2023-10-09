import te from 'fp-ts/lib/TaskEither.js';
import { createReadStream, createWriteStream } from 'node:fs';
import unzipper from 'unzipper';

import { FileServiceError, createFileServiceError } from '#infra/services/file/error.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

export type ExtractZipFile = (
  zipFilePath: string,
  outputFilePath: string,
) => te.TaskEither<ExtractZipFileError, void>;
export type ExtractZipFileError = FileServiceError<'ExtractZipFileFailed'>;
export function extractZipFile(
  ...[zipFilePath, outputFilePath]: Parameters<ExtractZipFile>
): ReturnType<ExtractZipFile> {
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
