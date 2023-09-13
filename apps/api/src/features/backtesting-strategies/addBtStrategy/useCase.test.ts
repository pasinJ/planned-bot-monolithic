import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';

import { DeepPartial } from '#shared/common.type.js';
import { isGeneralError } from '#shared/errors/generalError.js';
import { executeT } from '#shared/utils/fp.js';
import { randomExchangeName, randomLanguage, randomTimeframe } from '#test-utils/domain.js';
import {
  randomAnyDate,
  randomBeforeAndAfterDate,
  randomPositiveFloat,
  randomPositiveInt,
  randomString,
} from '#test-utils/faker.js';

import {
  createBtStrategyModelDaoError,
  isBtStrategyModelDaoError,
} from '../data-models/btStrategy.dao.error.js';
import { AddBtStrategyControllerDeps } from './controller.js';
import { AddBtStrategyDeps, AddBtStrategyRequest, addBtStrategy } from './useCase.js';

function mockDeps(overrides?: DeepPartial<AddBtStrategyDeps>): AddBtStrategyDeps {
  return mergeDeepRight(
    {
      btStrategyModelDao: {
        generateId: jest.fn().mockReturnValue(randomString()),
        add: jest.fn().mockReturnValue(te.right(undefined)),
      },
      dateService: { getCurrentDate: jest.fn().mockReturnValue(randomAnyDate()) },
    },
    overrides ?? {},
  ) as AddBtStrategyControllerDeps;
}
function mockValidRequest(): AddBtStrategyRequest {
  const { before, after } = randomBeforeAndAfterDate();
  return {
    name: randomString(),
    exchange: randomExchangeName(),
    symbol: randomString(),
    currency: randomString(),
    timeframe: randomTimeframe(),
    maxNumKlines: randomPositiveInt(),
    initialCapital: randomPositiveFloat(),
    takerFeeRate: randomPositiveFloat(),
    makerFeeRate: randomPositiveFloat(),
    startTimestamp: before,
    endTimestamp: after,
    language: randomLanguage(),
    body: randomString(),
  };
}

describe('WHEN successfully add a backtesting strategy', () => {
  it('THEN it should call generate backtesting strategy ID once', async () => {
    const deps = mockDeps();
    await executeT(addBtStrategy(deps, mockValidRequest()));

    expect(deps.btStrategyModelDao.generateId).toHaveBeenCalledOnce();
  });
  it('THEN it should call get current date once', async () => {
    const deps = mockDeps();
    await executeT(addBtStrategy(deps, mockValidRequest()));

    expect(deps.dateService.getCurrentDate).toHaveBeenCalledOnce();
  });
  it('THEN it should call add backtesting strategy once', async () => {
    const deps = mockDeps();
    await executeT(addBtStrategy(deps, mockValidRequest()));

    expect(deps.btStrategyModelDao.add).toHaveBeenCalledOnce();
  });
  it('THEN it should return Right of created id and timestamp', async () => {
    const id = randomString();
    const currentDate = randomAnyDate();
    const deps = mockDeps({
      dateService: { getCurrentDate: () => currentDate },
      btStrategyModelDao: { generateId: () => id },
    });
    const result = await executeT(addBtStrategy(deps, mockValidRequest()));

    expect(result).toEqualRight({ id, createdAt: currentDate });
  });
});

describe('WHEN try to add a backtesting strategy with invalid data', () => {
  it('THEN it should return Left of error', async () => {
    const data = { ...mockValidRequest(), startTimestamp: new Date('invalid') };
    const result = await executeT(addBtStrategy(mockDeps(), data));

    expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
  });
});

describe('WHEN adding a backtesting strategy using repository fails', () => {
  it('THEN it should return Left of error', async () => {
    const error = createBtStrategyModelDaoError('AddFailed', 'Mock');
    const deps = mockDeps({ btStrategyModelDao: { add: () => te.left(error) } });
    const result = await executeT(addBtStrategy(deps, mockValidRequest()));

    expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyModelDaoError));
  });
});
