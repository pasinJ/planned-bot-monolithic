import EventEmitter from 'events';
import { pino } from 'pino';
import { mergeDeepRight } from 'ramda';
import waitForExpect from 'wait-for-expect';

import { btExecutionStatusEnum } from '#features/backtesting-strategies/data-models/btExecution.model.js';
import { BtStrategyId } from '#features/backtesting-strategies/data-models/btStrategy.model.js';
import { executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { randomString } from '#test-utils/faker.js';
import { createMongoClient } from '#test-utils/mongoDb.js';

import { getJobSchedulerConfig } from '../../config.js';
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

describe('Job processor', () => {
  let jobScheduler: JobScheduler;

  afterEach(async () => {
    await jobCollection.deleteMany();
    await jobScheduler.stop();
  });

  describe('WHEN the job has been picked up', () => {
    it('THEN it should update status to be running', async () => {
      jobScheduler = unsafeUnwrapEitherRight(await executeT(createJobScheduler(mockDeps())));

      const btStrategyId = randomString() as BtStrategyId;
      await executeT(jobScheduler.addBtJob(btStrategyId));

      await waitForExpect.default(
        async () => {
          const jobRecord = await jobCollection.findOne({
            'data.btStrategyId': btStrategyId,
            'data.status': btExecutionStatusEnum.running,
          });
          expect(jobRecord).not.toBeNull();
        },
        5000,
        100,
      );
    });
    it('THEN it should fork a new worker process to handle the job', async () => {
      const deps = mockDeps();
      jobScheduler = unsafeUnwrapEitherRight(await executeT(createJobScheduler(deps)));

      const btStrategyId = randomString() as BtStrategyId;
      await executeT(jobScheduler.addBtJob(btStrategyId));

      await waitForExpect.default(() => expect(deps.fork).toHaveBeenCalledOnce());
    });

    describe('WHEN the worker process close with exit code equals to 0', () => {
      it('THEN it should call done', async () => {
        const worker = new EventEmitter();
        const deps = mockDeps({ fork: jest.fn().mockReturnValue(worker) });
        jobScheduler = unsafeUnwrapEitherRight(await executeT(createJobScheduler(deps)));

        const btStrategyId = randomString() as BtStrategyId;
        await executeT(jobScheduler.addBtJob(btStrategyId));

        await waitForExpect.default(
          async () => {
            expect(deps.fork).toHaveBeenCalledOnce();
            worker.emit('close', 0);

            const jobRecord = await jobCollection.findOne({
              'data.btStrategyId': btStrategyId,
              lastFinishedAt: { $ne: null },
            });
            expect(jobRecord).not.toBeNull();
          },
          4000,
          100,
        );
      });
    });

    describe('WHEN the worker process close with exit code other than 0', () => {
      it('THEN it should set status to failed and call done', async () => {
        const worker = new EventEmitter();
        const deps = mockDeps({ fork: jest.fn().mockReturnValue(worker) });
        jobScheduler = unsafeUnwrapEitherRight(await executeT(createJobScheduler(deps)));

        const btStrategyId = randomString() as BtStrategyId;
        await executeT(jobScheduler.addBtJob(btStrategyId));

        await waitForExpect.default(
          async () => {
            expect(deps.fork).toHaveBeenCalledOnce();
            worker.emit('close', 1);

            const jobRecord = await jobCollection.findOne({
              'data.btStrategyId': btStrategyId,
              'data.status': btExecutionStatusEnum.failed,
              lastFinishedAt: { $ne: null },
            });
            expect(jobRecord).not.toBeNull();
          },
          4000,
          100,
        );
      });
    });
  });
});
