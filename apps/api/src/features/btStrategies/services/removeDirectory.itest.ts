import { existsSync } from 'fs';
import { mkdir, open, rm } from 'fs/promises';

import { isFileServiceError } from '#infra/services/file/error.js';
import { executeT } from '#shared/utils/fp.js';
import { randomString } from '#test-utils/faker/string.js';

import { removeDirectory } from './removeDirectory.js';

const basePath = './test-area/';

beforeEach(() => mkdir(basePath));
afterEach(() => rm(basePath, { force: true, recursive: true }));

describe('[GIVEN] the directory contains only files', () => {
  beforeEach(async () => {
    await open(basePath + `${randomString()}.txt`, 'w');
    await open(basePath + `${randomString()}.txt`, 'w');
  });

  describe('[WHEN] remove the directory', () => {
    it('[THEN] it will be able to remove the directory', async () => {
      await executeT(removeDirectory(basePath));

      expect(existsSync(basePath)).toBeFalse();
    });
    it('[THEN] it will retun Right of undefined', async () => {
      const result = await executeT(removeDirectory(basePath));

      expect(result).toEqualRight(undefined);
    });
  });
});

describe('[GIVEN] the directory contains another sub-directory', () => {
  beforeEach(async () => {
    const subDir = basePath + `${randomString()}/`;
    await mkdir(subDir);
    await open(basePath + `${randomString()}.txt`, 'w');
    await open(subDir + `${randomString()}.txt`, 'w');
  });

  describe('[WHEN] remove the directory', () => {
    it('[THEN] it will be able to remove the directory', async () => {
      await executeT(removeDirectory(basePath));

      expect(existsSync(basePath)).toBeFalse();
    });
    it('[THEN] it will retun Right of undefined', async () => {
      const result = await executeT(removeDirectory(basePath));

      expect(result).toEqualRight(undefined);
    });
  });
});

describe('[GIVEN] the directory does not exist', () => {
  describe('[WHEN] remove the directory', () => {
    it('[THEN] it will retun Left of error', async () => {
      const result = await executeT(removeDirectory(basePath + `${randomString()}`));

      expect(result).toEqualLeft(expect.toSatisfy(isFileServiceError));
    });
  });
});
