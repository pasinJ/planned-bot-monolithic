import { existsSync } from 'fs';
import { mkdir, rm } from 'fs/promises';

import { isFileServiceError } from '#infra/services/file/error.js';
import { executeT } from '#shared/utils/fp.js';

import { createDirectory } from './createDirectory.js';

const basePath = './test-area/';

afterEach(() => rm(basePath, { force: true, recursive: true }));

describe('[GIVEN] the directory does not exist', () => {
  describe('[WHEN] create the directory', () => {
    it('[THEN] it will be able to create the directory', async () => {
      await executeT(createDirectory(basePath));

      expect(existsSync(basePath)).toBeTrue();
    });
    it('[THEN] it will return Right of undefined', async () => {
      const result = await executeT(createDirectory(basePath));

      expect(result).toEqualRight(undefined);
    });
  });
});

describe('[GIVEN] the directory already exists', () => {
  describe('[WHEN] create the directory', () => {
    it('[THEN] it will return Left of error', async () => {
      await mkdir(basePath);

      const result = await executeT(createDirectory(basePath));

      expect(result).toEqualLeft(expect.toSatisfy(isFileServiceError));
    });
  });
});
