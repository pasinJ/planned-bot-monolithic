import { parse } from 'csv-parse';
import te from 'fp-ts/lib/TaskEither.js';
import { createReadStream } from 'fs';

import { FileServiceError, createFileServiceError } from '#infra/services/file/error.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

export type ReadCsvFile = (csvFilePath: string) => te.TaskEither<ReadCsvFileError, string[][]>;
export type ReadCsvFileError = FileServiceError<'ReadCsvFileFailed'>;
export function readCsvFile(...[csvFilePath]: Parameters<ReadCsvFile>): ReturnType<ReadCsvFile> {
  const records: string[][] = [];

  return te.tryCatch(
    () =>
      new Promise((resolve, reject) => {
        const parser = createReadStream(csvFilePath)
          .on('error', (error) => reject(error))
          .pipe(parse({ delimiter: ',' }))
          .on('readable', function () {
            let record;
            while ((record = parser.read() as string[] | null) !== null) {
              records.push(record);
            }
          })
          .on('finish', () => resolve(records))
          .on('error', (error) => reject(error));
      }),
    createErrorFromUnknown(
      createFileServiceError('ReadCsvFileFailed', `Reading CSV file ${csvFilePath} failed`),
    ),
  );
}
