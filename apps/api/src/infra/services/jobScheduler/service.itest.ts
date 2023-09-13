import { executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';

import { createJobScheduler } from './service.js';
import { JobScheduler } from './service.type.js';

describe('Create job scheduler', () => {
  describe('WHEN successfully create a job scheduler', () => {
    let jobScheduler: JobScheduler;

    beforeAll(async () => {
      jobScheduler = unsafeUnwrapEitherRight(await executeT(createJobScheduler()));
    });
    afterAll(() => jobScheduler.stop());

    it('THEN it should return Right of job scheduler', () => {
      expect(jobScheduler).toEqual(expect.toContainAllKeys(['stop', 'addBtJob']));
    });
  });
});
