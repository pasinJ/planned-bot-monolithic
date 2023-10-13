import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { dateService } from '#infra/services/date/service.js';
import { getJobSchedulerConfig } from '#infra/services/jobScheduler/config.js';
import { JobScheduler, buildJobScheduler } from '#infra/services/jobScheduler/service.js';
import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { createMongoClient } from '#test-utils/mongoDb.js';
import { mockMainLogger } from '#test-utils/services.js';

import { BtExecutionId, btExecutionStatusEnum } from '../dataModels/btExecution.js';
import { BtStrategyId } from '../dataModels/btStrategy.js';
import { scheduleBtJob } from '../executeBtStrategy/backtesting.job.js';
import { isBtExecutionDaoError } from './btExecution.error.js';
import { getBtExecutionProgressById } from './btExecution.feature.js';
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
