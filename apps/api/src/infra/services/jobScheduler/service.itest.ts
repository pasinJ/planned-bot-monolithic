import { mergeDeepRight } from 'ramda';

import { executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { mockMainLogger } from '#test-utils/services.js';

import { JobScheduler, JobSchedulerDeps, buildJobScheduler } from './service.js';

function mockDeps(overrides?: Partial<JobSchedulerDeps>): JobSchedulerDeps {
  return mergeDeepRight({ mainLogger: mockMainLogger() }, overrides ?? {});
}

let jobScheduler: JobScheduler;

beforeAll(async () => {
  jobScheduler = unsafeUnwrapEitherRight(await executeT(buildJobScheduler(mockDeps())));
});
afterAll(() => jobScheduler.stop());

describe('UUT: Create job scheduler', () => {
  describe('[WHEN] create a job scheduler', () => {
    it('[THEN] it will return Right of job scheduler', () => {
      expect(jobScheduler).toEqual(expect.toContainAllKeys(['composeWith', 'start', 'stop']));
    });
  });
});
