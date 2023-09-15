import { pino } from 'pino';
import { mergeDeepRight } from 'ramda';

import { executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';

import { JobSchedulerDeps, createJobScheduler } from './service.js';
import { JobScheduler } from './service.type.js';

function mockDeps(overrides?: Partial<JobSchedulerDeps>): JobSchedulerDeps {
  return mergeDeepRight({ mainLogger: pino({ enabled: false }) }, overrides ?? {});
}

describe('Create job scheduler', () => {
  describe('WHEN successfully create a job scheduler', () => {
    let jobScheduler: JobScheduler;

    beforeAll(async () => {
      jobScheduler = unsafeUnwrapEitherRight(await executeT(createJobScheduler(mockDeps())));
    });
    afterAll(() => jobScheduler.stop());

    it('THEN it should return Right of job scheduler', () => {
      expect(jobScheduler).toEqual(expect.toContainAllKeys(['agenda', 'loggerIo', 'stop']));
    });
  });
});
