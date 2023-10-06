import { existsSync } from 'fs';
import { rm } from 'fs/promises';

import { isFileServiceError } from '#infra/services/file/error.js';
import { executeT } from '#shared/utils/fp.js';

import { extractZipFile } from './extractZipFile.js';

const outputPath = './downloads/klines.csv';

afterEach(() => rm(outputPath));

describe('[GIVEN] source zip file exists', () => {
  describe('[WHEN] extract the zip file', () => {
    it('[THEN] it will extract file to output path', async () => {
      await executeT(extractZipFile('./test-utils/klines.zip', outputPath));

      expect(existsSync(outputPath)).toBeTrue();
    });
    it('[THEN] it will return Right of undefined', async () => {
      const result = await executeT(extractZipFile('./test-utils/klines.zip', outputPath));

      expect(result).toEqualRight(undefined);
    });
  });
});

describe('[GIVEN] source zip file does not exist', () => {
  describe('[WHEN] extract the zip file', () => {
    it('[THEN] it will return Left of error', async () => {
      const result = await executeT(extractZipFile(`./test-utils/new.zip`, outputPath));

      expect(result).toEqualLeft(expect.toSatisfy(isFileServiceError));
    });
  });
});
