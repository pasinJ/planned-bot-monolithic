import { existsSync } from 'fs';
import { mkdir, open, rm } from 'fs/promises';

import { isFileServiceError } from '#infra/services/file/error.js';
import { executeT } from '#shared/utils/fp.js';
import { randomString } from '#test-utils/faker.js';

import { removeDirectory } from './removeDirectory.js';

const basePath = './test-area/';

describe('Remove directory', () => {
  beforeEach(() => mkdir(basePath));
  afterEach(() => rm(basePath, { force: true, recursive: true }));

  describe('WHEN the directory contains only files', () => {
    it('THEN it should be able to remove the directory', async () => {
      await open(basePath + `${randomString()}.txt`, 'w');
      await open(basePath + `${randomString()}.txt`, 'w');

      await executeT(removeDirectory(basePath));

      expect(existsSync(basePath)).toBeFalse();
    });
  });

  describe('WHEN the directory contains another directory', () => {
    it('THEN it should be able to remove the directory', async () => {
      const subDir = basePath + `${randomString()}/`;
      await mkdir(subDir);
      await open(basePath + `${randomString()}.txt`, 'w');
      await open(subDir + `${randomString()}.txt`, 'w');

      await executeT(removeDirectory(basePath));

      expect(existsSync(basePath)).toBeFalse();
    });
  });

  describe('WHEN successfully remove directory', () => {
    it('THEN it should retun Right of undefined', async () => {
      const result = await executeT(removeDirectory(basePath));

      expect(result).toEqualRight(undefined);
    });
  });

  describe('WHEN the directory does not exist', () => {
    it('THEN it should retun Left of error', async () => {
      const result = await executeT(removeDirectory(basePath + `${randomString()}`));

      expect(result).toEqualLeft(expect.toSatisfy(isFileServiceError));
    });
  });
});
