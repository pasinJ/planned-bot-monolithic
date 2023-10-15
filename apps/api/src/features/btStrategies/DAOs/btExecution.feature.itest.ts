import { Agenda } from 'agenda';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import waitForExpect from 'wait-for-expect';

import { dateService } from '#infra/services/date/service.js';
import { getJobSchedulerConfig } from '#infra/services/jobScheduler/config.js';
import { JobScheduler, buildJobScheduler } from '#infra/services/jobScheduler/service.js';
import { createGeneralError } from '#shared/errors/generalError.js';
import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { mockStrategyModule } from '#test-utils/features/shared/strategyModule.js';
import { createMongoClient } from '#test-utils/mongoDb.js';
import { mockMainLogger } from '#test-utils/services.js';

import { BtExecutionId, btExecutionStatusEnum } from '../dataModels/btExecution.js';
import { BtStrategyId } from '../dataModels/btStrategy.js';
import { getBtJobConfig } from '../executeBtStrategy/backtesting.job.config.js';
import { defineBtJob, scheduleBtJob } from '../executeBtStrategy/backtesting.job.js';
import { isBtExecutionDaoError } from './btExecution.error.js';
import { getBtExecutionProgressById, getBtExecutionResultById } from './btExecution.feature.js';
import { BtExecutionMongooseModel, btExecutionModelName, buildBtExecutionDao } from './btExecution.js';

const client = await createMongoClient();
const agendaCollection = getJobSchedulerConfig().COLLECTION_NAME;
const btExecutionDao = unsafeUnwrapEitherRight(executeIo(buildBtExecutionDao(client, agendaCollection)));
const btExecutionModel: BtExecutionMongooseModel = client.models[btExecutionModelName];

afterEach(() => btExecutionModel.deleteMany());
afterAll(() => client.disconnect());

describe('UUT: Get backtesting execution progress by ID', () => {
  const getProgressByIdFn = btExecutionDao.composeWith(getBtExecutionProgressById);

  describe('[GIVEN] the execution ID does not exist', () => {
    describe('[WHEN] get backtesting execution progress by ID', () => {
      it('[THEN] it will return Left of error', async () => {
        const notExistExecutionId = 'nj9U7qbFX7';

        const result = await executeT(getProgressByIdFn(notExistExecutionId));

        expect(result).toEqualLeft(expect.toSatisfy(isBtExecutionDaoError));
      });
    });
  });

  describe('[GIVEN] the execution ID exists', () => {
    const executionId = 'TIoOQWizJ-' as BtExecutionId;
    const btStrategyId = 'xCL3_BM66P' as BtStrategyId;

    let jobScheduler: JobScheduler;
    let scheduleBtJobFn: ReturnType<ReturnType<typeof scheduleBtJob>>;

    beforeAll(async () => {
      jobScheduler = unsafeUnwrapEitherRight(
        await pipe(
          buildJobScheduler({ mainLogger: mockMainLogger(), getJobSchedulerConfig }),
          te.chainFirstW((jobScheduler) => jobScheduler.start),
          executeT,
        ),
      );
      scheduleBtJobFn = jobScheduler.composeWith(
        scheduleBtJob({ dateService, btExecutionDao: { generateId: () => executionId } }),
      );
      await executeT(scheduleBtJobFn(btStrategyId));
    });
    afterAll(() => jobScheduler.stop());

    describe('[WHEN] get backtesting execution progress by ID', () => {
      it('[THEN] it will return Right of execution progress', async () => {
        const result = await executeT(getProgressByIdFn(executionId));

        expect(result).toEqualRight({
          id: executionId,
          btStrategyId,
          status: btExecutionStatusEnum.PENDING,
          percentage: 0,
          logs: [],
        });
      });
    });
  });
});

describe('UUT: Get backtesting execution result by ID', () => {
  const getResultByIdFn = btExecutionDao.composeWith(getBtExecutionResultById);

  describe('[GIVEN] the execution ID does not exist', () => {
    describe('[WHEN] get backtesting execution result by ID', () => {
      it('[THEN] it will return Left of error', async () => {
        const notExistExecutionId = 'nj9U7qbFX7';

        const result = await executeT(getResultByIdFn(notExistExecutionId));

        expect(result).toEqualLeft(expect.toSatisfy(isBtExecutionDaoError));
      });
    });
  });

  describe('[GIVEN] the execution ID exists [BUT] it has PENDING status', () => {
    const executionId = 'TIoOQWizJ-' as BtExecutionId;
    const btStrategyId = 'xCL3_BM66P' as BtStrategyId;

    let jobScheduler: JobScheduler;
    let scheduleBtJobFn: ReturnType<ReturnType<typeof scheduleBtJob>>;

    beforeAll(async () => {
      jobScheduler = unsafeUnwrapEitherRight(
        await pipe(
          buildJobScheduler({ mainLogger: mockMainLogger(), getJobSchedulerConfig }),
          te.chainFirstW((jobScheduler) => jobScheduler.start),
          executeT,
        ),
      );
      scheduleBtJobFn = jobScheduler.composeWith(
        scheduleBtJob({ dateService, btExecutionDao: { generateId: () => executionId } }),
      );
    });
    afterAll(() => jobScheduler.stop());

    describe('[WHEN] get backtesting execution result by ID', () => {
      it('[THEN] it will return Left of error', async () => {
        await executeT(scheduleBtJobFn(btStrategyId));

        const result = await executeT(getResultByIdFn(executionId));

        expect(result).toEqualLeft(expect.toSatisfy(isBtExecutionDaoError));
      });
    });
  });

  describe('[GIVEN] the execution ID exists [BUT] it has RUNNING status', () => {
    const executionId = 'TIoOQWizJ-' as BtExecutionId;
    const btStrategyId = 'xCL3_BM66P' as BtStrategyId;

    let jobScheduler: JobScheduler;
    let scheduleBtJobFn: ReturnType<ReturnType<typeof scheduleBtJob>>;
    const forkSpy = jest.fn();

    beforeAll(async () => {
      jobScheduler = unsafeUnwrapEitherRight(
        await pipe(
          buildJobScheduler({ mainLogger: mockMainLogger(), getJobSchedulerConfig }),
          te.chainFirstW((jobScheduler) => jobScheduler.start),
          te.chainFirstW((jobScheduler) =>
            te.fromIOEither(jobScheduler.composeWith(defineBtJob({ getBtJobConfig, fork: forkSpy }))),
          ),
          executeT,
        ),
      );
      scheduleBtJobFn = jobScheduler.composeWith(
        scheduleBtJob({ dateService, btExecutionDao: { generateId: () => executionId } }),
      );
    });
    afterAll(() => jobScheduler.stop());

    describe('[WHEN] get backtesting execution result by ID', () => {
      it('[THEN] it will return Left of error', async () => {
        await executeT(scheduleBtJobFn(btStrategyId));
        await waitForExpect.default(() => {
          expect(forkSpy).toHaveBeenCalled();
        });

        const result = await executeT(getResultByIdFn(executionId));

        expect(result).toEqualLeft(expect.toSatisfy(isBtExecutionDaoError));
      });
    });
  });

  describe('[GIVEN] the execution ID exists [BUT] it has FINISHED status', () => {
    const executionId = 'TIoOQWizJ-' as BtExecutionId;
    const btStrategyId = 'xCL3_BM66P' as BtStrategyId;

    let agenda: Agenda;
    let jobScheduler: JobScheduler;
    let scheduleBtJobFn: ReturnType<ReturnType<typeof scheduleBtJob>>;

    beforeAll(async () => {
      const { URI, COLLECTION_NAME } = getJobSchedulerConfig();
      agenda = new Agenda({ db: { address: URI, collection: COLLECTION_NAME } });
      await agenda.start();

      jobScheduler = unsafeUnwrapEitherRight(
        await pipe(
          buildJobScheduler({ mainLogger: mockMainLogger(), getJobSchedulerConfig }),
          te.chainFirstW((jobScheduler) => jobScheduler.start),
          executeT,
        ),
      );
      scheduleBtJobFn = jobScheduler.composeWith(
        scheduleBtJob({ dateService, btExecutionDao: { generateId: () => executionId } }),
      );
    });
    afterAll(async () => {
      await jobScheduler.stop();
      await agenda.stop();
      await agenda.close();
    });

    describe('[WHEN] get backtesting execution result by ID', () => {
      it('[THEN] it will return Left of error', async () => {
        await executeT(scheduleBtJobFn(btStrategyId));

        const logs = ['log1', 'log2'];
        const strategyModule = mockStrategyModule();
        const orders = {
          openingOrders: [],
          submittedOrders: [],
          triggeredOrders: [],
          filledOrders: [],
          canceledOrders: [],
          rejectedOrders: [],
        };
        const trades = { openingTrades: [], closedTrades: [] };
        await agenda._collection.updateOne(
          { 'data.id': executionId },
          {
            $set: {
              'data.status': btExecutionStatusEnum.FINISHED,
              result: { logs, strategyModule, orders, trades },
            },
          },
        );

        const result = await executeT(getResultByIdFn(executionId));

        expect(result).toEqualRight({
          id: executionId,
          btStrategyId,
          status: btExecutionStatusEnum.FINISHED,
          executionTimeMs: expect.toBeNumber(),
          logs,
          strategyModule,
          orders,
          trades,
        });
      });
    });
  });

  describe('[GIVEN] the execution ID exists [BUT] it has FAILED status', () => {
    const executionId = 'TIoOQWizJ-' as BtExecutionId;
    const btStrategyId = 'xCL3_BM66P' as BtStrategyId;

    let agenda: Agenda;
    let jobScheduler: JobScheduler;
    let scheduleBtJobFn: ReturnType<ReturnType<typeof scheduleBtJob>>;

    beforeAll(async () => {
      const { URI, COLLECTION_NAME } = getJobSchedulerConfig();
      agenda = new Agenda({ db: { address: URI, collection: COLLECTION_NAME } });
      await agenda.start();

      jobScheduler = unsafeUnwrapEitherRight(
        await pipe(
          buildJobScheduler({ mainLogger: mockMainLogger(), getJobSchedulerConfig }),
          te.chainFirstW((jobScheduler) => jobScheduler.start),
          executeT,
        ),
      );
      scheduleBtJobFn = jobScheduler.composeWith(
        scheduleBtJob({ dateService, btExecutionDao: { generateId: () => executionId } }),
      );
    });
    afterAll(async () => {
      await jobScheduler.stop();
      await agenda.stop();
      await agenda.close();
    });

    describe('[WHEN] get backtesting execution result by ID', () => {
      it('[THEN] it will return Left of error', async () => {
        await executeT(scheduleBtJobFn(btStrategyId));

        const logs = ['log1', 'log2'];
        const error = createGeneralError('Error', 'Mock').toJSON();
        await agenda._collection.updateOne(
          { 'data.id': executionId },
          {
            $set: {
              'data.status': btExecutionStatusEnum.FAILED,
              result: { logs, error },
            },
          },
        );

        const result = await executeT(getResultByIdFn(executionId));

        expect(result).toEqualRight({
          id: executionId,
          btStrategyId,
          status: btExecutionStatusEnum.FAILED,
          executionTimeMs: expect.toBeNumber(),
          logs,
          error,
        });
      });
    });
  });
});
