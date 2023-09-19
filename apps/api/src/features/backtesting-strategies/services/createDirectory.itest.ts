import { existsSync } from 'fs';
import { mkdir, rm } from 'fs/promises';

import { isFileServiceError } from '#infra/services/file/error.js';
import { executeT } from '#shared/utils/fp.js';

import { createDirectory } from './createDirectory.js';

const basePath = './test-area/';

describe('Create directory', () => {
  afterEach(() => rm(basePath, { force: true, recursive: true }));

  describe('WHEN the directory does not exist', () => {
    it('THEN it should be able to create the directory', async () => {
      await executeT(createDirectory(basePath));

      expect(existsSync(basePath)).toBeTrue();
    });
    it('THEN it should return Right of undefined', async () => {
      const result = await executeT(createDirectory(basePath));

      expect(result).toEqualRight(undefined);
    });
  });

  describe('WHEN the directory already exists', () => {
    it('THEN it should return Left of error', async () => {
      await mkdir(basePath);

      const result = await executeT(createDirectory(basePath));

      expect(result).toEqualLeft(expect.toSatisfy(isFileServiceError));
    });
  });
});
