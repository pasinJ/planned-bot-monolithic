import EventEmitter from 'events';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { pino } from 'pino';
import { isNotNil, mergeDeepRight, path } from 'ramda';
import waitForExpect from 'wait-for-expect';

import { btExecutionStatusEnum } from '#features/backtesting-strategies/data-models/btExecution.model.js';
import { BtStrategyId } from '#features/backtesting-strategies/data-models/btStrategy.model.js';
import { getJobSchedulerConfig } from '#infra/services/jobScheduler/config.js';
import { isJobSchedulerError } from '#infra/services/jobScheduler/service.error.js';
import { createJobScheduler } from '#infra/services/jobScheduler/service.js';
import { JobScheduler } from '#infra/services/jobScheduler/service.type.js';
import { executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { randomString } from '#test-utils/faker.js';
import { createMongoClient } from '#test-utils/mongoDb.js';

import { buildBtJobScheduler } from '../services/jobScheduler.js';
import { BtJobDeps, defineBtJob } from './backtesting.job.js';

function mockDeps(overrides?: Partial<BtJobDeps>): BtJobDeps {
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

  async function setupJobScheduler(overrides?: Partial<BtJobDeps>, shouldDefineJob?: boolean) {
    // Stop the default instance that was initiate in beforeEach
    if (isNotNil(jobScheduler)) await jobScheduler.stop();

    jobScheduler = unsafeUnwrapEitherRight(
      await pipe(
        createJobScheduler({ mainLogger: pino({ enabled: false }) }),
        te.chainFirstW(({ agenda, loggerIo }) =>
          shouldDefineJob ?? true
            ? te.fromIOEither(defineBtJob(agenda, loggerIo, mockDeps(overrides)))
            : te.right(undefined),
        ),
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
        const btJobScheduler = buildBtJobScheduler(jobScheduler);

        const result = await executeT(btJobScheduler.scheduleBtJob(randomString() as BtStrategyId));

        expect(result).toEqualRight({ id: expect.toBeString(), createdAt: expect.toBeDate() });
      });
      it('THEN the job scheduler should be able to pickup the scheduled job', async () => {
        const deps = mockDeps();
        await setupJobScheduler(deps);
        const btJobScheduler = buildBtJobScheduler(jobScheduler);

        const btStrategyId = randomString() as BtStrategyId;
        const addedJob = await executeT(btJobScheduler.scheduleBtJob(btStrategyId));
        const executionId = path(['right', 'id'], addedJob);

        await waitForExpect.default(() =>
          expect(deps.fork).toHaveBeenCalledWith(expect.anything(), [executionId], expect.anything()),
        );
      });
    });
    describe('GIVEN there is a running backtesting job WHEN schedule a new backtesting job', () => {
      it('THEN it should return Left of error', async () => {
        const deps = mockDeps();
        await setupJobScheduler(deps);
        const btJobScheduler = buildBtJobScheduler(jobScheduler);

        const id = randomString() as BtStrategyId;
        await executeT(btJobScheduler.scheduleBtJob(id));

        // Wait for job scheduler to pick the first job up
        // The job will not be finished b/c we never trigger 'close' event of the worker process
        await waitForExpect.default(() => expect(deps.fork).toHaveBeenCalledOnce());

        const result = await executeT(btJobScheduler.scheduleBtJob(id));

        expect(result).toEqualLeft(expect.toSatisfy(isJobSchedulerError));
      });
    });
    describe('GIVEN there is a pending backtesting job WHEN schedule a new backtesting job', () => {
      it('THEN it should return Left of error', async () => {
        // Not define backtesting job, so the job scheduler will never pick it up
        await setupJobScheduler(undefined, false);
        const btJobScheduler = buildBtJobScheduler(jobScheduler);

        const id = randomString() as BtStrategyId;
        await executeT(btJobScheduler.scheduleBtJob(id));

        const result = await executeT(btJobScheduler.scheduleBtJob(id));

        expect(result).toEqualLeft(expect.toSatisfy(isJobSchedulerError));
      });
    });
  });

  describe('WHEN the job has been picked up', () => {
    it('THEN it should update status to be running', async () => {
      const btJobScheduler = buildBtJobScheduler(jobScheduler);

      const btStrategyId = randomString() as BtStrategyId;
      await executeT(btJobScheduler.scheduleBtJob(btStrategyId));

      await waitForExpect.default(async () => {
        const jobRecord = await jobCollection.findOne({
          'data.btStrategyId': btStrategyId,
          'data.status': btExecutionStatusEnum.running,
        });
        expect(jobRecord).not.toBeNull();
      });
    });
    it('THEN it should fork a new worker process to handle the job', async () => {
      const deps = mockDeps();
      await setupJobScheduler(deps);
      const btJobScheduler = buildBtJobScheduler(jobScheduler);

      const btStrategyId = randomString() as BtStrategyId;
      await executeT(btJobScheduler.scheduleBtJob(btStrategyId));

      await waitForExpect.default(() => expect(deps.fork).toHaveBeenCalledOnce());
    });
  });

  describe('WHEN the worker process close with exit code equals to 0', () => {
    it('THEN it should call done', async () => {
      const worker = new EventEmitter();
      const deps = mockDeps({ fork: jest.fn().mockReturnValue(worker) });
      await setupJobScheduler(deps);
      const btJobScheduler = buildBtJobScheduler(jobScheduler);

      const btStrategyId = randomString() as BtStrategyId;
      await executeT(btJobScheduler.scheduleBtJob(btStrategyId));

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
      const deps = mockDeps({ fork: jest.fn().mockReturnValue(worker) });
      await setupJobScheduler(deps);
      const btJobScheduler = buildBtJobScheduler(jobScheduler);

      const btStrategyId = randomString() as BtStrategyId;
      await executeT(btJobScheduler.scheduleBtJob(btStrategyId));

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
