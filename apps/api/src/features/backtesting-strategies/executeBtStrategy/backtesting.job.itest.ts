import EventEmitter from 'events';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { isNotNil, mergeDeepRight } from 'ramda';
import waitForExpect from 'wait-for-expect';

import {
  BtExecutionId,
  btExecutionStatusEnum,
} from '#features/backtesting-strategies/data-models/btExecution.js';
import { BtStrategyId } from '#features/backtesting-strategies/data-models/btStrategy.js';
import { getJobSchedulerConfig } from '#infra/services/jobScheduler/config.js';
import { isJobSchedulerError } from '#infra/services/jobScheduler/error.js';
import { JobScheduler, buildJobScheduler } from '#infra/services/jobScheduler/service.js';
import { executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { randomAnyDate, randomString } from '#test-utils/faker.js';
import { createMongoClient } from '#test-utils/mongoDb.js';
import { mockMainLogger } from '#test-utils/services.js';

import { BtJobDeps, ScheduleBtJobDeps, defineBtJob, scheduleBtJob } from './backtesting.job.js';

function mockBtJobDeps(overrides?: Partial<BtJobDeps>): BtJobDeps {
  return mergeDeepRight(
    { mainLogger: mockMainLogger(), fork: jest.fn().mockReturnValue(new EventEmitter()) },
    overrides ?? {},
  );
}
function mockScheduleBtJobDeps(overrides?: Partial<ScheduleBtJobDeps>): ScheduleBtJobDeps {
  return mergeDeepRight(
    {
      dateService: { getCurrentDate: () => randomAnyDate() },
      btExecutionDao: { generateId: () => randomBtExecutionId() },
    },
    overrides ?? {},
  );
}
function randomBtStrategyId() {
  return randomString() as BtStrategyId;
}
function randomBtExecutionId() {
  return randomString() as BtExecutionId;
}

const client = await createMongoClient();
const { COLLECTION_NAME } = getJobSchedulerConfig();
const jobCollection = client.connection.collection(COLLECTION_NAME);

afterAll(() => client.disconnect());

describe('Job processor', () => {
  let jobScheduler: JobScheduler;

  async function setupJobScheduler(overrides?: Partial<BtJobDeps>, shouldDefineJob?: boolean) {
    // Stop the default instance that was initiate in beforeEach
    if (isNotNil(jobScheduler)) await jobScheduler.stop();

    jobScheduler = unsafeUnwrapEitherRight(
      await pipe(
        buildJobScheduler({ mainLogger: mockMainLogger() }),
        te.chainFirstW((jobScheduler) =>
          shouldDefineJob ?? true
            ? te.fromIOEither(jobScheduler.composeWith(defineBtJob(mockBtJobDeps(overrides))))
            : te.right(undefined),
        ),
        te.chainFirstW((jobScheduler) => jobScheduler.start),
        executeT,
      ),
    );
  }

  beforeEach(() => setupJobScheduler());
  afterEach(async () => {
    await jobCollection.deleteMany();
    await jobScheduler.stop();
  });

  describe('Schedule backtesting job', () => {
    describe('WHEN scheduling a backtesting job succeeds', () => {
      it('THEN it should return Right of ID and created timestamp', async () => {
        const executionId = randomBtExecutionId();
        const currentDate = randomAnyDate();
        const deps = mockScheduleBtJobDeps({
          btExecutionDao: { generateId: () => executionId },
          dateService: { getCurrentDate: () => currentDate },
        });
        const scheduleBtJobFn = jobScheduler.composeWith(scheduleBtJob(deps));

        const result = await executeT(scheduleBtJobFn(randomBtStrategyId()));

        expect(result).toEqualRight({ id: executionId, createdAt: currentDate });
      });
      it('THEN the job scheduler should be able to pickup the scheduled job', async () => {
        const jobDeps = mockBtJobDeps();
        await setupJobScheduler(jobDeps);

        const executionId = randomBtExecutionId();
        const deps = mockScheduleBtJobDeps({ btExecutionDao: { generateId: () => executionId } });
        const scheduleBtJobFn = jobScheduler.composeWith(scheduleBtJob(deps));

        await executeT(scheduleBtJobFn(randomBtStrategyId()));

        await waitForExpect.default(() =>
          expect(jobDeps.fork).toHaveBeenCalledWith(expect.anything(), [executionId], expect.anything()),
        );
      });
    });
    describe('GIVEN there is a running backtesting job WHEN schedule a new backtesting job', () => {
      it('THEN it should return Left of error', async () => {
        const jobDeps = mockBtJobDeps();
        await setupJobScheduler(jobDeps);
        const scheduleBtJobFn = jobScheduler.composeWith(scheduleBtJob(mockScheduleBtJobDeps()));

        const id = randomBtStrategyId();
        await executeT(scheduleBtJobFn(id));

        // Wait for job scheduler to pick the first job up
        // This job will not be finished b/c we never trigger 'close' event of the worker process
        await waitForExpect.default(() => expect(jobDeps.fork).toHaveBeenCalledOnce());

        const result = await executeT(scheduleBtJobFn(id));

        expect(result).toEqualLeft(expect.toSatisfy(isJobSchedulerError));
      });
    });
    describe('GIVEN there is a pending backtesting job WHEN schedule a new backtesting job', () => {
      it('THEN it should return Left of error', async () => {
        // Not define backtesting job, so the job scheduler will never pick it up
        await setupJobScheduler(undefined, false);
        const scheduleBtJobFn = jobScheduler.composeWith(scheduleBtJob(mockScheduleBtJobDeps()));

        const id = randomBtStrategyId();
        await executeT(scheduleBtJobFn(id));

        const result = await executeT(scheduleBtJobFn(id));

        expect(result).toEqualLeft(expect.toSatisfy(isJobSchedulerError));
      });
    });
  });

  describe('WHEN the job has been picked up', () => {
    it('THEN it should update status to be running', async () => {
      const scheduleBtJobFn = jobScheduler.composeWith(scheduleBtJob(mockScheduleBtJobDeps()));

      const btStrategyId = randomBtStrategyId();
      await executeT(scheduleBtJobFn(btStrategyId));

      await waitForExpect.default(async () => {
        const jobRecord = await jobCollection.findOne({
          'data.btStrategyId': btStrategyId,
          'data.status': btExecutionStatusEnum.running,
        });
        expect(jobRecord).not.toBeNull();
      });
    });
    it('THEN it should fork a new worker process to handle the job', async () => {
      const deps = mockBtJobDeps();
      await setupJobScheduler(deps);
      const scheduleBtJobFn = jobScheduler.composeWith(scheduleBtJob(mockScheduleBtJobDeps()));

      const btStrategyId = randomBtStrategyId();
      await executeT(scheduleBtJobFn(btStrategyId));

      await waitForExpect.default(() => expect(deps.fork).toHaveBeenCalledOnce());
    });
  });

  describe('WHEN the worker process close with exit code equals to 0', () => {
    it('THEN it should call done', async () => {
      const worker = new EventEmitter();
      const deps = mockBtJobDeps({ fork: jest.fn().mockReturnValue(worker) });
      await setupJobScheduler(deps);
      const scheduleBtJobFn = jobScheduler.composeWith(scheduleBtJob(mockScheduleBtJobDeps()));

      const btStrategyId = randomBtStrategyId();
      await executeT(scheduleBtJobFn(btStrategyId));

      await waitForExpect.default(async () => {
        expect(deps.fork).toHaveBeenCalledOnce();
        worker.emit('close', 0);

        const jobRecord = await jobCollection.findOne({
          'data.btStrategyId': btStrategyId,
          lastFinishedAt: { $ne: null },
        });
        expect(jobRecord).not.toBeNull();
      });
    });
  });

  describe('WHEN the worker process close with exit code other than 0', () => {
    it('THEN it should set status to failed and call done', async () => {
      const worker = new EventEmitter();
      const deps = mockBtJobDeps({ fork: jest.fn().mockReturnValue(worker) });
      await setupJobScheduler(deps);
      const scheduleBtJobFn = jobScheduler.composeWith(scheduleBtJob(mockScheduleBtJobDeps()));

      const btStrategyId = randomString() as BtStrategyId;
      await executeT(scheduleBtJobFn(btStrategyId));

      await waitForExpect.default(async () => {
        expect(deps.fork).toHaveBeenCalledOnce();
        worker.emit('close', 1);

        const jobRecord = await jobCollection.findOne({
          'data.btStrategyId': btStrategyId,
          'data.status': btExecutionStatusEnum.failed,
          lastFinishedAt: { $ne: null },
        });
        expect(jobRecord).not.toBeNull();
      });
    });
  });
});
