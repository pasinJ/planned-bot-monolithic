import { existsSync } from 'fs';
import { rm } from 'fs/promises';

import { isGeneralError } from '#shared/errors/generalError.js';
import { executeT } from '#shared/utils/fp.js';
import { randomString } from '#test-utils/faker.js';

import { extractZipFile } from './extractZipFile.js';

describe('Extract zip file', () => {
  const outputPath = './downloads/klines.csv';

  afterEach(() => rm(outputPath));

  describe('GIVEN source zip file exists WHEN extract zip file', () => {
    it('THEN it should extract file to output path', async () => {
      await executeT(extractZipFile('./test-utils/klines.zip', outputPath));

      expect(existsSync(outputPath)).toBeTrue();
    });
    it('THEN it should return Right of undefined', async () => {
      const result = await executeT(extractZipFile('./test-utils/klines.zip', outputPath));

      expect(result).toEqualRight(undefined);
    });
  });

  describe('GIVEN source zip file does not exist WHEN extract zip file', () => {
    it('THEN it should return Left of error', async () => {
      const result = await executeT(extractZipFile(`./test-utils/${randomString()}.zip`, outputPath));

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
});
