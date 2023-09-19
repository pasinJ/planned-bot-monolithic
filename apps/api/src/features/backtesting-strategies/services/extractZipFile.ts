import te from 'fp-ts/lib/TaskEither.js';
import { createReadStream, createWriteStream } from 'node:fs';
import unzipper from 'unzipper';

import { createErrorFromUnknown } from '#shared/errors/appError.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';

export function extractZipFile(
  zipFilePath: string,
  outputFilePath: string,
): te.TaskEither<GeneralError<'ExtractZipFileFailed'>, void> {
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
      createGeneralError('ExtractZipFileFailed', `Extracting zip file from ${zipFilePath} failed`),
    ),
  );
}
