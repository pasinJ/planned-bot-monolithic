import { isFileServiceError } from '#infra/services/file/error.js';
import { executeT } from '#shared/utils/fp.js';
import { randomString } from '#test-utils/faker/string.js';

import { readCsvFile } from './readCsvFile.js';

describe('[GIVEN] source CSV file exists', () => {
  describe('[WHEN] read CSV file', () => {
    it('[THEN] it will return Right of content of the CSV file', async () => {
      const result = await executeT(readCsvFile('./test-utils/klines.csv'));

      expect(result).toEqualRight([
        [
          '1694649600000',
          '0.23440000',
          '0.24470000',
          '0.23240000',
          '0.24440000',
          '108910.40000000',
          '1694735999999',
          '25878.78325000',
          '249',
          '53757.80000000',
          '12872.91321000',
          '0',
        ],
      ]);
    });
  });
});

describe('[GIVEN] source CSV file is empty', () => {
  describe('[WHEN] read CSV file', () => {
    it('[THEN] it will return Right of an empty array', async () => {
      const result = await executeT(readCsvFile('./test-utils/empty.csv'));

      expect(result).toEqualRight([]);
    });
  });
});

describe('[GIVEN] source CSV file does not exist', () => {
  describe('[WHEN] read CSV file', () => {
    it('[THEN] it will return Left of error', async () => {
      const result = await executeT(readCsvFile(`./test-utils/${randomString()}.csv`));

      expect(result).toEqualLeft(expect.toSatisfy(isFileServiceError));
    });
  });
});
