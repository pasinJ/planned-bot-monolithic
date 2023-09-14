import EventEmitter from 'events';
import { pino } from 'pino';
import { mergeDeepRight } from 'ramda';

import { BtStrategyId } from '#features/backtesting-strategies/data-models/btStrategy.model.js';
import { executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { randomString } from '#test-utils/faker.js';
import { createMongoClient } from '#test-utils/mongoDb.js';

import { getJobSchedulerConfig } from '../../config.js';
import { isJobSchedulerError } from '../../service.error.js';
import { JobSchedulerDeps, createJobScheduler } from '../../service.js';
import { JobScheduler } from '../../service.type.js';

function mockDeps(overrides?: Partial<JobSchedulerDeps>): JobSchedulerDeps {
  return mergeDeepRight(
    { mainLogger: pino({ enabled: false }), fork: jest.fn().mockReturnValue(new EventEmitter()) },
    overrides ?? {},
  );
}

const client = await createMongoClient();
const { COLLECTION_NAME } = getJobSchedulerConfig();
const jobCollection = client.connection.collection(COLLECTION_NAME);

afterAll(() => client.disconnect());

describe('Add backtesting job', () => {
  let jobScheduler: JobScheduler;

  beforeAll(async () => {
    jobScheduler = unsafeUnwrapEitherRight(await executeT(createJobScheduler(mockDeps())));
  });
  afterEach(() => jobCollection.deleteMany());
  afterAll(() => jobScheduler.stop());

  describe('WHEN adding a backtesting job succeeds', () => {
    it('THEN it should return Right of ID and created timestamp', async () => {
      const result = await executeT(jobScheduler.addBtJob(randomString() as BtStrategyId));

      expect(result).toEqualRight({ id: expect.toBeString(), createdAt: expect.toBeDate() });
    });
    it('THEN it should add a new job record into database', async () => {
      const id = randomString() as BtStrategyId;
      await executeT(jobScheduler.addBtJob(id));

      const records = await jobCollection.find().toArray();
      expect(records).toHaveLength(1);
      expect(records.at(0)).toHaveProperty('name');
      expect(records.at(0)).toHaveProperty('data.id');
      expect(records.at(0)).toHaveProperty('data.btStrategyId', id);
      expect(records.at(0)).toHaveProperty('data.status', 'pending');
    });
  });
  describe('GIVEN there is a pending backtesting job WHEN add a new backtesting job', () => {
    it('THEN it should return Left of error', async () => {
      const id = randomString() as BtStrategyId;
      await executeT(jobScheduler.addBtJob(id));

      const result = await executeT(jobScheduler.addBtJob(id));

      expect(result).toEqualLeft(expect.toSatisfy(isJobSchedulerError));
    });
  });
});
