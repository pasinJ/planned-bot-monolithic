import EventEmitter from 'events';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { isNotNil, mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';
import waitForExpect from 'wait-for-expect';

import { BtExecutionId, btExecutionStatusEnum } from '#features/btStrategies/dataModels/btExecution.js';
import { getJobSchedulerConfig } from '#infra/services/jobScheduler/config.js';
import { JobSchedulerError, isJobSchedulerError } from '#infra/services/jobScheduler/error.js';
import { JobScheduler, buildJobScheduler } from '#infra/services/jobScheduler/service.js';
import { ValidDate } from '#shared/utils/date.js';
import { executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { createMongoClient } from '#test-utils/mongoDb.js';
import { mockMainLogger } from '#test-utils/services.js';

import { BtStrategyId } from '../dataModels/btStrategy.js';
import { BtJobConcurrency, BtJobTimeout, BtWorkerModulePath } from './backtesting.job.config.js';
import { BtJobDeps, ScheduleBtJobDeps, defineBtJob, scheduleBtJob } from './backtesting.job.js';

function mockBtJobDeps(overrides?: DeepPartial<BtJobDeps>): BtJobDeps {
  return mergeDeepRight<BtJobDeps, DeepPartial<BtJobDeps>>(
    {
      fork: jest.fn().mockReturnValue(new EventEmitter()),
      getBtJobConfig: () => ({
        JOB_CONCURRENCY: 1 as BtJobConcurrency,
        JOB_TIMEOUT_MS: 1000 as BtJobTimeout,
        JOB_WORKER_MODULE_PATH: './path' as BtWorkerModulePath,
      }),
    },
    overrides ?? {},
  ) as BtJobDeps;
}
function mockScheduleBtJobDeps(overrides?: DeepPartial<ScheduleBtJobDeps>): ScheduleBtJobDeps {
  return mergeDeepRight(
    {
      dateService: { getCurrentDate: () => new Date('2010-11-12') as ValidDate },
      btExecutionDao: { generateId: () => 'Z8l21wwpnF' as BtExecutionId },
    },
    overrides ?? {},
  );
}

const client = await createMongoClient();
const { COLLECTION_NAME } = getJobSchedulerConfig();
const jobCollection = client.connection.collection(COLLECTION_NAME);

afterAll(() => client.disconnect());

describe('UUT: Backtesting job processor', () => {
  let jobScheduler: JobScheduler;
  const anyBtStrategyId = 'z0zIQb0kQ9' as BtStrategyId;
  type ScheduleBtJobFn = (btStrategyId: BtStrategyId) => te.TaskEither<
    JobSchedulerError<'ScheduleJobFailed' | 'ExceedJobMaxSchedulingLimit'>,
    Readonly<{
      id: BtExecutionId;
      createdAt: ValidDate;
    }>
  >;

  async function setupJobScheduler(overrides?: Partial<BtJobDeps>, shouldDefineJob?: boolean) {
    // Stop the default instance that was initiate in beforeEach
    if (isNotNil(jobScheduler)) await jobScheduler.stop();

    jobScheduler = unsafeUnwrapEitherRight(
      await pipe(
        buildJobScheduler({ mainLogger: mockMainLogger(), getJobSchedulerConfig }),
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

  describe('[GIVEN] there is no pending or running backtesting job', () => {
    let jobDeps: BtJobDeps;
    let deps: ScheduleBtJobDeps;
    const executionId = 'a8h2C56s75' as BtExecutionId;
    const currentDate = new Date('2011-04-03') as ValidDate;
    const btStrategyId = anyBtStrategyId;
    let scheduleBtJobFn: ScheduleBtJobFn;

    beforeEach(async () => {
      jobDeps = mockBtJobDeps();
      await setupJobScheduler(jobDeps);
      deps = mockScheduleBtJobDeps({
        btExecutionDao: { generateId: () => executionId },
        dateService: { getCurrentDate: () => currentDate },
      });
      scheduleBtJobFn = jobScheduler.composeWith(scheduleBtJob(deps));
    });

    describe('[WHEN] schedule a backtesting job', () => {
      it('[THEN] it will return Right of execution ID and created timestamp', async () => {
        const result = await executeT(scheduleBtJobFn(btStrategyId));

        expect(result).toEqualRight({ id: executionId, createdAt: currentDate });
      });
      it('[THEN] a job scheduler should be able to pickup the scheduled job', async () => {
        await executeT(scheduleBtJobFn(btStrategyId));

        await waitForExpect.default(() =>
          expect(jobDeps.fork).toHaveBeenCalledWith(expect.anything(), [executionId], expect.anything()),
        );
      });
    });
  });

  describe('[GIVEN] there is a running backtesting job', () => {
    describe('[WHEN] schedule another backtesting job', () => {
      it('[THEN] it will return Left of error', async () => {
        const jobDeps = mockBtJobDeps();
        await setupJobScheduler(jobDeps);
        const scheduleBtJobFn = jobScheduler.composeWith(scheduleBtJob(mockScheduleBtJobDeps()));

        const btStrategyId = anyBtStrategyId;
        await executeT(scheduleBtJobFn(btStrategyId));

        // Wait for job scheduler to pick the first job up
        // This job will not be finished b/c we never trigger 'close' event of the worker process
        await waitForExpect.default(() => expect(jobDeps.fork).toHaveBeenCalledOnce());

        const result = await executeT(scheduleBtJobFn(btStrategyId));

        expect(result).toEqualLeft(expect.toSatisfy(isJobSchedulerError));
      });
    });
  });

  describe('[GIVEN] there is a pending backtesting job', () => {
    describe('[WHEN] schedule another backtesting job', () => {
      it('[THEN] it will return Left of error', async () => {
        // Not define backtesting job, so the job scheduler will never pick it up
        await setupJobScheduler(undefined, false);
        const scheduleBtJobFn = jobScheduler.composeWith(scheduleBtJob(mockScheduleBtJobDeps()));

        const btStrategyId = anyBtStrategyId;
        await executeT(scheduleBtJobFn(btStrategyId));

        const result = await executeT(scheduleBtJobFn(btStrategyId));

        expect(result).toEqualLeft(expect.toSatisfy(isJobSchedulerError));
      });
    });
  });

  describe('[WHEN] a job scheduler pick a backtesting job up', () => {
    let scheduleBtJobFn: ScheduleBtJobFn;
    let jobDeps: BtJobDeps;
    const btStrategyId = anyBtStrategyId;

    beforeEach(async () => {
      jobDeps = mockBtJobDeps();
      await setupJobScheduler(jobDeps);
      scheduleBtJobFn = jobScheduler.composeWith(scheduleBtJob(mockScheduleBtJobDeps()));
    });

    it('[THEN] it will update job status to be RUNNING', async () => {
      await executeT(scheduleBtJobFn(btStrategyId));

      await waitForExpect.default(async () => {
        const jobRecord = await jobCollection.findOne({
          'data.btStrategyId': btStrategyId,
          'data.status': btExecutionStatusEnum.RUNNING,
        });
        expect(jobRecord).not.toBeNull();
      });
    });
    it('[THEN] it will fork a new worker process to handle the job', async () => {
      await executeT(scheduleBtJobFn(btStrategyId));

      await waitForExpect.default(() => expect(jobDeps.fork).toHaveBeenCalledOnce());
    });
  });

  describe('[WHEN] a backtesting worker process close with exit code 0', () => {
    it('[THEN] it will set finish timestamp', async () => {
      const worker = new EventEmitter();
      const deps = mockBtJobDeps({ fork: jest.fn().mockReturnValue(worker) });
      await setupJobScheduler(deps);
      const scheduleBtJobFn = jobScheduler.composeWith(scheduleBtJob(mockScheduleBtJobDeps()));
      const btStrategyId = anyBtStrategyId;

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

  describe('[WHEN] a backtesting worker process close with exit code other than 0', () => {
    it('[THEN] it will set status to FAILED and set finish timestamp', async () => {
      const worker = new EventEmitter();
      const deps = mockBtJobDeps({ fork: jest.fn().mockReturnValue(worker) });
      await setupJobScheduler(deps);
      const scheduleBtJobFn = jobScheduler.composeWith(scheduleBtJob(mockScheduleBtJobDeps()));
      const btStrategyId = anyBtStrategyId;

      await executeT(scheduleBtJobFn(btStrategyId));

      await waitForExpect.default(async () => {
        expect(deps.fork).toHaveBeenCalledOnce();
        worker.emit('close', 1);

        const jobRecord = await jobCollection.findOne({
          'data.btStrategyId': btStrategyId,
          'data.status': btExecutionStatusEnum.FAILED,
          lastFinishedAt: { $ne: null },
        });
        expect(jobRecord).not.toBeNull();
      });
    });
  });
});
