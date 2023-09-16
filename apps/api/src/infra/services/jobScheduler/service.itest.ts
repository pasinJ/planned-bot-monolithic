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

describe('Create job scheduler', () => {
  describe('WHEN successfully create a job scheduler', () => {
    it('THEN it should return Right of job scheduler', () => {
      expect(jobScheduler).toEqual(expect.toContainAllKeys(['composeWith', 'start', 'stop']));
    });
  });
});
